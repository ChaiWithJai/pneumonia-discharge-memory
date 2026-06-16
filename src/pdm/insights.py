"""Eval insights — turn the conference's numbers into Hamel-grounded guidance.

Two layers, both offline-first:

  * Deterministic recommendations derived from alignment + failure taxonomy +
    counts, each tagged to a principle from Hamel Husain's evals FAQ.
  * An optional Bonsai "advisor" pass: the same numbers narrated by the local
    writer, system-prompted with the Hamel canon. Falls back to None offline.

Also provides a rule suggester for the Decide step (Bonsai with a deterministic
template fallback).
"""

from __future__ import annotations

from typing import Any

from .evals import axial_taxonomy
from .export import build_bundle
from .memory import InstitutionalMemory
from .schemas import PatientCase

# A compact, faithful distillation of https://hamel.dev/blog/posts/evals-faq/ —
# used to ground both the deterministic rules and the Bonsai advisor prompt.
HAMEL_CANON = (
    "Eval principles (Hamel Husain): "
    "(1) Error analysis is the foundation — read traces, open-code notes, then axial-code into a "
    "failure taxonomy; let that decide which evals to write. Spend 60–80% of effort here. "
    "(2) Use binary pass/fail, not Likert. "
    "(3) Build an LLM-as-judge only for persistent, subjective failures, and only after prompt fixes fail; "
    "then align it to human labels and measure TPR/TNR on a held-out set. "
    "(4) Avoid generic metrics (BERTScore/ROUGE/'helpfulness') — they create false confidence. "
    "(5) A 100% pass rate means the cases are too easy; sample outliers and hard cases. "
    "(6) ~100 traces gives saturation; review 10–20 fresh traces regularly. "
    "(7) Mine real, observed failures for training data — not imagined ones."
)

ADVISOR_SYSTEM = (
    "You are an evaluation advisor for a clinical AI team. Ground every suggestion in these principles and "
    "name the principle you are applying. Be concrete and brief — 2 to 3 short paragraphs, no preamble, no "
    "medical advice. This is a synthetic teaching scenario.\n\n" + HAMEL_CANON
)


def confusion_overall(memory: InstitutionalMemory) -> dict[str, int]:
    """Tool (as automated judge) vs. room (human label), across the session."""
    tp = fp = tn = fn = 0
    for e in memory.events():
        if e.get("type") != "conference_case_completed":
            continue
        room = bool(e.get("room_distrusts"))
        tool = bool(e.get("tool_flags_review"))
        if room and tool:
            tp += 1
        elif not room and tool:
            fp += 1
        elif room and not tool:
            fn += 1
        else:
            tn += 1
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn}


def _overall_alignment(bundle: dict[str, Any]) -> dict[str, Any] | None:
    return next((a for a in bundle["alignment"] if a["knowledge_layer"] == "overall"), None)


def _taxonomy(memory: InstitutionalMemory) -> list[dict]:
    notes = [e.get("rationale", "") for e in memory.load_eval_cases()]
    return axial_taxonomy(notes)


def _pass_rate(memory: InstitutionalMemory) -> float | None:
    evals = memory.load_eval_cases()
    if not evals:
        return None
    passed = sum(1 for e in evals if e.get("expected") == "pass")
    return round(passed / len(evals), 3)


def interpret(confusion: dict[str, int], align: dict[str, Any] | None) -> str:
    n = sum(confusion.values())
    if n == 0:
        return "No conference cases yet — run a session to generate evals."
    if confusion["fp"] > confusion["fn"]:
        bias = "the runtime over-flags (it routes cases to review the room would have cleared)"
    elif confusion["fn"] > confusion["fp"]:
        bias = "the runtime under-flags (it clears cases the room would have stopped)"
    else:
        bias = "the runtime and the room are roughly balanced"
    tprtnr = ""
    if align:
        tprtnr = f" TPR {align['tpr']:.2f}, TNR {align['tnr']:.2f} against the room's verdicts."
    return f"Across {n} case(s), {bias}.{tprtnr}"


def recommendations(memory: InstitutionalMemory) -> list[dict[str, str]]:
    bundle = build_bundle(memory)
    counts = bundle["counts"]
    align = _overall_alignment(bundle)
    conf = confusion_overall(memory)
    tax = _taxonomy(memory)
    n = sum(conf.values())
    recs: list[dict[str, str]] = []

    if n and n < 5:
        recs.append({
            "title": "Review more cases",
            "detail": f"You've reviewed {n}. Aim toward ~100 traces for theoretical saturation; review 10–20 fresh cases regularly.",
            "principle": "Error analysis is the foundation",
            "severity": "info",
        })

    top = next((t for t in tax if t["category"] != "other" and t["count"] > 0), None)
    if top:
        recs.append({
            "title": f"Concentrate on “{top['category'].replace('_', ' ')}”",
            "detail": f"It's your most frequent failure mode ({top['count']}×). Write a targeted assertion or eval here before building anything generic.",
            "principle": "Let the data decide which evals to write",
            "severity": "action",
        })

    if align and conf["tn"] + conf["fp"] > 0 and align["tnr"] < 0.6:
        recs.append({
            "title": "The runtime over-flags",
            "detail": "Low TNR: it routes cases to review the room would have cleared. Tighten the disposition rules or add an alignment pass.",
            "principle": "Align the automated judge to human labels (TPR/TNR)",
            "severity": "warn",
        })
    if align and conf["tp"] + conf["fn"] > 0 and align["tpr"] < 0.6:
        recs.append({
            "title": "The runtime misses what the room catches",
            "detail": "Low TPR: add checks for the steps the room failed — those overturns are your highest-signal training data.",
            "principle": "Align the automated judge to human labels (TPR/TNR)",
            "severity": "warn",
        })

    if counts["preference_pairs"] > 0:
        recs.append({
            "title": f"Use your {counts['preference_pairs']} preference pair(s)",
            "detail": "Each is a place the room overturned the tool — DPO-ready signal. Start alignment/fine-tuning from these real failures, not synthetic data.",
            "principle": "Mine real, observed failures — not imagined ones",
            "severity": "action",
        })

    if align and align["tool_vs_outcome_agreement"] < 0.6 and n:
        recs.append({
            "title": "Recalibrate disposition to outcomes",
            "detail": "The runtime's disposition weakly predicts readmission. Validate thresholds against the data lake before trusting it.",
            "principle": "Validate against reality, not generic metrics",
            "severity": "warn",
        })

    pr = _pass_rate(memory)
    if pr is not None and pr >= 1.0 and (memory.load_eval_cases()):
        recs.append({
            "title": "Your cases may be too easy",
            "detail": "Every step passed. A 100% pass rate usually means the system isn't being challenged — sample outliers and hard cases.",
            "principle": "100% pass = not challenging enough",
            "severity": "warn",
        })

    if not recs:
        recs.append({
            "title": "Keep going",
            "detail": "Run more cases to surface failure patterns; error analysis is where the leverage is.",
            "principle": "Error analysis is the foundation",
            "severity": "info",
        })
    return recs


def insights(memory: InstitutionalMemory, writer: object | None = None) -> dict[str, Any]:
    bundle = build_bundle(memory)
    conf = confusion_overall(memory)
    align = _overall_alignment(bundle)
    recs = recommendations(memory)
    advisor = None

    if writer is not None and getattr(writer, "available", lambda: False)():
        try:
            prompt = (
                f"Session so far: {interpret(conf, align)} "
                f"Counts: {bundle['counts']}. Confusion (tool vs room): {conf}. "
                f"Failure taxonomy: {[(t['category'], t['count']) for t in _taxonomy(memory)]}. "
                "Give the team 2–3 concrete next steps, each naming the principle."
            )
            text = writer.complete(prompt, system=ADVISOR_SYSTEM, max_tokens=320)  # type: ignore[attr-defined]
            advisor = {"text": text, "source": "bonsai"}
        except Exception:
            advisor = None

    return {
        "interpretation": interpret(conf, align),
        "confusion": conf,
        "alignment": bundle["alignment"],
        "taxonomy": _taxonomy(memory),
        "counts": bundle["counts"],
        "pass_rate": _pass_rate(memory),
        "recommendations": recs,
        "advisor": advisor,
        "canon": HAMEL_CANON,
    }


# --- rule suggestion for the Decide step ---------------------------------------

RULE_SYSTEM = (
    "You write one reusable clinical-operations rule as a short IF → THEN sentence a future clinician could apply. "
    "No medical advice, no diagnosis, no fear; synthetic teaching scenario. Output only the rule, one line."
)


def _template_rule(case: PatientCase, failed_steps: list[str]) -> str:
    if case.social.lives_alone and not case.social.caregiver_available and case.meds.med_access_risk == "high":
        return "IF the patient lives alone AND medication-access risk is high THEN require confirmed pharmacy delivery or follow-up before discharge."
    if case.labs.cultures_pending and "analyze" in failed_steps:
        return "IF cultures are still pending AND the infection signal is borderline THEN reconfirm clinical stability before final handoff."
    if case.mobility.current_mobility_drop in {"moderate", "severe"}:
        return "IF mobility has dropped to moderate or worse THEN route a home-support plan through care management before discharge."
    return "IF any clinically-weighted step is flagged by the room THEN require clinician sign-off before discharge."


def suggest_rule(case: PatientCase, failed_steps: list[str], writer: object | None = None) -> dict[str, str]:
    if writer is not None and getattr(writer, "available", lambda: False)():
        try:
            flagged = ", ".join(failed_steps) or "none"
            prompt = (
                f"Case: {case.age}yo, {case.diagnosis}, lives_alone={case.social.lives_alone}, "
                f"med_access_risk={case.meds.med_access_risk}, cultures_pending={case.labs.cultures_pending}, "
                f"mobility_drop={case.mobility.current_mobility_drop}. Room flagged steps: {flagged}. "
                "Write one reusable IF → THEN discharge rule."
            )
            text = writer.complete(prompt, system=RULE_SYSTEM, max_tokens=80)  # type: ignore[attr-defined]
            return {"text": text.strip().strip('"'), "source": "bonsai"}
        except Exception:
            pass
    return {"text": _template_rule(case, failed_steps), "source": "template"}
