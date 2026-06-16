"""The case-conference engine.

Orchestrates one session: present a scored case, collect the room's binary tally
judgments on the three clinically-weighted trace steps, reconcile against the
mocked data lake, and record the leader's consensus + one reusable rule. Produces
a `CaseStudy` (the durable teaching artifact) and persists everything, chain-tagged,
to institutional memory.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .datalake import outcome_for
from .memory import InstitutionalMemory
from .runtime import run
from .schemas import (
    CaseStudy,
    Judgment,
    KnowledgeLayer,
    Lesson,
    Outcome,
    PatientCase,
    RuntimeResult,
    Session,
)

JUDGED_STEPS = ["analyze", "simulate", "output"]


# --- derived signals for evals -------------------------------------------------

def tool_flags_review(runtime: RuntimeResult) -> bool:
    """The tool 'predicts a problem' when it routes the case to clinician review."""
    return runtime.handoff.disposition == "clinician_review_required"


def room_distrusts(judgments: list[Judgment]) -> bool:
    """The room 'predicts a problem' when it fails any judged step."""
    return any(j.consensus == "fail" for j in judgments)


def step_trace(runtime: RuntimeResult, step: str):
    return next((t for t in runtime.trace if t.state.value == step), None)


def step_prompt(runtime: RuntimeResult, step: str) -> str:
    tr = step_trace(runtime, step)
    if tr is None:
        return f"At the {step} step for case {runtime.patient_id}, evaluate correctness."
    outputs = "; ".join(tr.outputs[:4])
    return (
        f"Case {runtime.patient_id} — {step} step. The runtime did: {tr.action} "
        f"Key outputs: {outputs}. Did the runtime handle this step correctly?"
    )


# --- case study prose (deterministic; Bonsai enhances in the UI) ---------------

def hero_seed(case_id: str) -> int:
    return sum(ord(c) for c in case_id) % 1000


def vignette_for(case: PatientCase) -> str:
    alone = "living alone" if case.social.lives_alone and not case.social.caregiver_available else "with support at home"
    access = "a difficult medication-access situation" if case.meds.med_access_risk == "high" else "manageable medication access"
    return (
        f"A {case.age}-year-old recovering from {case.diagnosis.replace('_', ' ')}, {alone}, "
        f"facing {access}. The team must decide whether home today is safe — or whether the plan needs to change first."
    )


def build_case_study(
    case: PatientCase,
    runtime: RuntimeResult,
    outcome: Outcome | None,
    judgments: list[Judgment],
    lesson: Lesson | None,
    layer: KnowledgeLayer,
) -> CaseStudy:
    verdict_bits = [f"{j.step}: {j.consensus} ({j.split})" for j in judgments]
    verdict = "; ".join(verdict_bits) if verdict_bits else "no judgments recorded"
    return CaseStudy(
        source_case_id=case.patient_id,
        hero_image_seed=hero_seed(case.patient_id),
        vignette=vignette_for(case),
        scenario_narrations=[s.empathy_prompt for s in runtime.scenarios],
        verdict_summary=f"Room verdict — {verdict}. Disposition: {runtime.handoff.disposition}.",
        outcome=outcome,
        lesson=lesson,
        knowledge_layer=layer,
    )


# --- session lifecycle ---------------------------------------------------------

def start_session(session_id: str, case_ids: list[str]) -> Session:
    return Session(id=session_id, case_ids=case_ids, active_case_id=case_ids[0] if case_ids else None)


def present(case: PatientCase, memory: InstitutionalMemory) -> RuntimeResult:
    """Run the governed runtime so the room has a scored trace to react to."""
    return run(case, memory=memory)


def reconcile(case_id: str) -> Outcome:
    return outcome_for(case_id)


@dataclass
class ConferenceResult:
    runtime: RuntimeResult
    outcome: Outcome
    judgments: list[Judgment]
    lesson: Lesson | None
    case_study: CaseStudy


def finalize_case(
    memory: InstitutionalMemory,
    session: Session,
    case: PatientCase,
    runtime: RuntimeResult,
    judgments: list[Judgment],
    lesson: Lesson | None,
    layer: KnowledgeLayer = KnowledgeLayer.SERVICE_LINE,
) -> ConferenceResult:
    """Reconcile with the lake, build the case study, and persist everything."""
    outcome = reconcile(case.patient_id)
    case_study = build_case_study(case, runtime, outcome, judgments, lesson, layer)

    session.judgments[case.patient_id] = judgments
    if lesson is not None:
        session.lessons.append(lesson)
        memory.record_lesson(lesson)
    memory.record_case_study(case_study)
    memory.record_event(
        {
            "type": "conference_case_completed",
            "session_id": session.id,
            "patient_id": case.patient_id,
            "knowledge_layer": layer.value,
            "room_distrusts": room_distrusts(judgments),
            "tool_flags_review": tool_flags_review(runtime),
            "readmitted_30d": outcome.readmitted_30d,
            "note": "Synthetic demo event. Do not store PHI.",
        }
    )
    return ConferenceResult(runtime=runtime, outcome=outcome, judgments=judgments, lesson=lesson, case_study=case_study)
