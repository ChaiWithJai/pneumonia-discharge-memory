"""Evaluation layer — Hamel-grade, scoped to the discharge conference.

Turns the room's binary judgments into the things a data team can actually use:

  * Binary eval cases (expected = room consensus; the human label is ground truth).
  * Preference pairs wherever the room overturns the tool (the learning signal).
  * An axial failure taxonomy from the open-coded notes (frequency per category).
  * Judge alignment: TPR/TNR of the tool's disposition against the room's label,
    plus a reality check of both against the data-lake outcome — reported per
    knowledge layer.

Binary, not Likert. We surface disagreement honestly; a 100% pass session means
the cases were too easy.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from .schemas import EvalCase, JudgeAlignment, Judgment, KnowledgeLayer, Lesson, PreferencePair, RuntimeResult
from .session import room_distrusts, step_prompt, tool_flags_review

# Axial-coding buckets: open-coded notes cluster into these failure categories.
_TAXONOMY = {
    "medication_access": ["med", "pharmacy", "access", "delivery", "adherence", "prescription"],
    "social_support": ["alone", "caregiver", "support", "home", "isolation", "family"],
    "unresolved_infection": ["culture", "wbc", "fever", "afebrile", "infection", "procalcitonin"],
    "frailty_mobility": ["frail", "mobility", "fall", "nutrition", "walk"],
    "oxygenation_vitals": ["spo2", "oxygen", "sat", "vital", "respiratory"],
    "data_completeness": ["unknown", "missing", "pending", "gap", "data"],
}


def build_eval_cases(runtime: RuntimeResult, judgments: list[Judgment], layer: KnowledgeLayer) -> list[EvalCase]:
    return [
        EvalCase(
            id=f"{runtime.patient_id}:{j.step}",
            source_case_id=runtime.patient_id,
            step=j.step,
            prompt=step_prompt(runtime, j.step),
            expected=j.consensus,
            knowledge_layer=layer,
            rationale=j.note,
        )
        for j in judgments
    ]


def build_preference_pairs(
    runtime: RuntimeResult,
    judgments: list[Judgment],
    lesson: Lesson | None,
    layer: KnowledgeLayer,
) -> list[PreferencePair]:
    """A pair is emitted only where the room overturns the tool (real signal)."""
    pairs: list[PreferencePair] = []
    for j in judgments:
        if j.consensus == "fail":
            pairs.append(
                PreferencePair(
                    prompt=step_prompt(runtime, j.step),
                    chosen=(f"Flag the {j.step} step for clinician review. " + j.note).strip(),
                    rejected=f"Accept the runtime's {j.step} output as correct without review.",
                    knowledge_layer=layer,
                    source_case_id=runtime.patient_id,
                )
            )
    if lesson is not None:
        pairs.append(
            PreferencePair(
                prompt=f"For case {runtime.patient_id}, what rule should guide the discharge decision?",
                chosen=lesson.text,
                rejected=f"Proceed with the runtime's default disposition: {runtime.handoff.disposition}.",
                knowledge_layer=lesson.knowledge_layer,
                source_case_id=runtime.patient_id,
            )
        )
    return pairs


def axial_taxonomy(notes: list[str]) -> list[dict]:
    """Open codes (free-form notes) -> failure categories with frequency."""
    counts: dict[str, list[str]] = defaultdict(list)
    for note in notes:
        if not note.strip():
            continue
        low = note.lower()
        matched = False
        for category, keywords in _TAXONOMY.items():
            if any(k in low for k in keywords):
                counts[category].append(note)
                matched = True
        if not matched:
            counts["other"].append(note)
    return sorted(
        ({"category": c, "count": len(v), "examples": v[:3]} for c, v in counts.items()),
        key=lambda d: d["count"],
        reverse=True,
    )


@dataclass(frozen=True)
class AlignmentRecord:
    knowledge_layer: str
    tool_positive: bool   # tool routed to clinician review
    room_positive: bool   # room failed at least one step
    truth_positive: bool  # patient was readmitted


def alignment_record(runtime: RuntimeResult, judgments: list[Judgment], readmitted: bool, layer: KnowledgeLayer) -> AlignmentRecord:
    return AlignmentRecord(
        knowledge_layer=layer.value,
        tool_positive=tool_flags_review(runtime),
        room_positive=room_distrusts(judgments),
        truth_positive=readmitted,
    )


def _safe(numer: int, denom: int) -> float:
    return round(numer / denom, 3) if denom else 0.0


def _alignment_for(layer: str, records: list[AlignmentRecord]) -> JudgeAlignment:
    # Tool (judge) vs room (human label): TPR/TNR.
    tp = sum(1 for r in records if r.room_positive and r.tool_positive)
    fn = sum(1 for r in records if r.room_positive and not r.tool_positive)
    tn = sum(1 for r in records if not r.room_positive and not r.tool_positive)
    fp = sum(1 for r in records if not r.room_positive and r.tool_positive)
    room_truth = _safe(sum(1 for r in records if r.room_positive == r.truth_positive), len(records))
    tool_truth = _safe(sum(1 for r in records if r.tool_positive == r.truth_positive), len(records))
    return JudgeAlignment(
        knowledge_layer=layer,
        n=len(records),
        tpr=_safe(tp, tp + fn),
        tnr=_safe(tn, tn + fp),
        room_vs_outcome_agreement=room_truth,
        tool_vs_outcome_agreement=tool_truth,
    )


def alignment(records: list[AlignmentRecord]) -> list[JudgeAlignment]:
    groups: dict[str, list[AlignmentRecord]] = defaultdict(list)
    for r in records:
        groups[r.knowledge_layer].append(r)
        groups["overall"].append(r)
    return [_alignment_for(layer, rs) for layer, rs in groups.items()]
