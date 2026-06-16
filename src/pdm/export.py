"""Export layer — the value-add output a data/AI team can consume directly.

Reads what the conference persisted to institutional memory and emits standard,
open artifacts: a binary eval suite (JSONL), DPO-ready preference data (JSONL),
human-readable case studies (Markdown), and a per-layer alignment report. The
alignment is recomputed from the manifest's conference events, so no extra
bookkeeping is needed.
"""

from __future__ import annotations

import json
from typing import Any

from .evals import AlignmentRecord, alignment
from .memory import InstitutionalMemory


def _jsonl(rows: list[dict[str, Any]]) -> str:
    return "\n".join(json.dumps(r, sort_keys=True) for r in rows) + ("\n" if rows else "")


def eval_suite_jsonl(memory: InstitutionalMemory) -> str:
    return _jsonl(memory.load_eval_cases())


def preferences_jsonl(memory: InstitutionalMemory) -> str:
    return _jsonl(memory.load_preferences())


def alignment_from_events(memory: InstitutionalMemory):
    records = [
        AlignmentRecord(
            knowledge_layer=e.get("knowledge_layer", "service_line"),
            tool_positive=bool(e.get("tool_flags_review")),
            room_positive=bool(e.get("room_distrusts")),
            truth_positive=bool(e.get("readmitted_30d")),
        )
        for e in memory.events()
        if e.get("type") == "conference_case_completed"
    ]
    return alignment(records) if records else []


def case_studies_markdown(memory: InstitutionalMemory) -> str:
    studies = memory.load_case_studies()
    if not studies:
        return "# Teaching cases\n\n_No case studies recorded yet._\n"
    out = ["# Teaching cases — pneumonia discharge\n"]
    for s in studies:
        out.append(f"## {s['source_case_id']} · {s['knowledge_layer']}")
        out.append(f"_Hero image seed: {s['hero_image_seed']} (Bonsai Image 4B, seed-locked)_\n")
        out.append(f"**Vignette.** {s['vignette']}\n")
        if s.get("verdict_summary"):
            out.append(f"**Verdict.** {s['verdict_summary']}\n")
        outcome = s.get("outcome")
        if outcome:
            ra = "readmitted" if outcome["readmitted_30d"] else "not readmitted"
            day = f" (day {outcome['days_to_readmit']})" if outcome.get("days_to_readmit") else ""
            out.append(f"**Outcome (mock data lake).** {ra}{day}.\n")
        lesson = s.get("lesson")
        if lesson:
            out.append(f"**Lesson.** {lesson['text']}\n")
        out.append("")
    return "\n".join(out)


def alignment_report(memory: InstitutionalMemory) -> list[dict[str, Any]]:
    return [a.model_dump(mode="json") for a in alignment_from_events(memory)]


def build_bundle(memory: InstitutionalMemory) -> dict[str, Any]:
    """Everything the S8 'download bundle' needs, in one payload."""
    return {
        "eval_suite_jsonl": eval_suite_jsonl(memory),
        "preferences_jsonl": preferences_jsonl(memory),
        "case_studies_markdown": case_studies_markdown(memory),
        "alignment": alignment_report(memory),
        "counts": {
            "eval_cases": len(memory.load_eval_cases()),
            "preference_pairs": len(memory.load_preferences()),
            "case_studies": len(memory.load_case_studies()),
            "lessons": len(memory.load_lessons()),
        },
    }
