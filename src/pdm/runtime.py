from __future__ import annotations

from pathlib import Path

from .instruments import factory_instruments, score_case
from .memory import append_memory, memory_event
from .schemas import HandoffRecommendation, PatientCase, RuntimeResult, RuntimeState, Score, TraceStep
from .whatif import generate_whatif_scenarios


def plan_trace(case: PatientCase) -> list[str]:
    requirements = [
        "Confirm afebrile duration and current vital stability.",
        "Evaluate WBC/procalcitonin trajectory and culture-pending status.",
        "Estimate frailty from mobility, falls, age, nutrition, and prior utilization.",
        "Assess medication access, adherence concern, pharmacy distance, and support availability.",
        "Generate what-if scenarios for discharge timing and support interventions.",
        "Prepare structured human handoff with red flags and reasoning trace.",
    ]
    if case.mobility.current_mobility_drop in {"moderate", "severe"}:
        requirements.append("Route updated mobility assessment before discharge sign-off.")
    if case.social.lives_alone and not case.social.caregiver_available:
        requirements.append("Route care-management review for home support gap.")
    return requirements


def recursive_checks(scores: list[Score], case: PatientCase) -> list[str]:
    checks: list[str] = []
    for score in scores:
        if score.band == "high":
            checks.append(f"{score.name} high: force clinician_review_required.")
        if score.name == "secondary_infection_risk" and score.value >= 0.34 and case.labs.cultures_pending:
            checks.append("Infection risk borderline/high with pending cultures: re-evaluate before final handoff.")
        if score.name == "environmental_medication_access_risk" and score.value >= 0.34:
            checks.append("Access risk elevated: verify medication-in-hand or delivery before discharge.")
    if not checks:
        checks.append("No high-risk recursive checks triggered in synthetic scoring path.")
    return checks


def handoff(case: PatientCase, scores: list[Score], checks: list[str]) -> HandoffRecommendation:
    high = [s.name for s in scores if s.band == "high"]
    moderate = [s.name for s in scores if s.band == "moderate"]

    red_flags = []
    if high:
        red_flags.append(f"High-risk domains: {', '.join(high)}.")
    if case.vitals.afebrile_hours < 48:
        red_flags.append("Afebrile duration below 48 hours in demo criteria.")
    if case.labs.cultures_pending:
        red_flags.append("Cultures pending.")

    actions = [
        "Clinician reviews reasoning trace and confirms disposition.",
        "Medication access is verified before discharge.",
        "Teach-back and follow-up plan are documented.",
    ]
    if "frailty_index" in high or "frailty_index" in moderate:
        actions.append("Mobility and home support plan reviewed with care management.")
    if "environmental_medication_access_risk" in high or "environmental_medication_access_risk" in moderate:
        actions.append("Medication delivery or pharmacy access support considered.")

    if high or len(moderate) >= 2:
        disposition = "clinician_review_required"
        summary = "Synthetic runtime flags this case for clinician review before discharge."
    elif moderate:
        disposition = "ready_with_supports"
        summary = "Synthetic runtime suggests discharge may be reasonable only with documented supports."
    else:
        disposition = "ready_with_supports"
        summary = "Synthetic runtime finds no high-risk signals but still requires human sign-off."

    return HandoffRecommendation(
        disposition=disposition,
        summary=summary,
        actions_to_consider=actions,
        red_flags=red_flags,
        clinician_note="Demo only: treating clinician must validate all findings against the real chart and local policy.",
    )


def run(case: PatientCase, memory_dir: Path | None = None) -> RuntimeResult:
    trace: list[TraceStep] = []
    instruments = factory_instruments()
    trace.append(
        TraceStep(
            state=RuntimeState.FACTORY,
            action="Construct pneumonia discharge instruments.",
            inputs=["clinical objective", "synthetic case schema", "source-informed discharge-risk categories"],
            outputs=[i.name for i in instruments],
            checks=["instrument metadata declared", "limitations declared", "synthetic-only flag retained"],
        )
    )

    plan = plan_trace(case)
    trace.append(
        TraceStep(
            state=RuntimeState.PLAN,
            action="Create auditable discharge readiness trace.",
            inputs=["patient_case", "instrument_inventory"],
            outputs=plan,
            checks=["data gaps represented", "human handoff retained"],
        )
    )

    scores = score_case(case)
    checks = recursive_checks(scores, case)
    trace.append(
        TraceStep(
            state=RuntimeState.ANALYZE,
            action="Score frailty, infection, and environmental access risk.",
            inputs=[s.name for s in scores],
            outputs=[f"{s.name}:{s.band}:{s.value}" for s in scores],
            checks=checks,
        )
    )

    scenarios = generate_whatif_scenarios(case, scores)
    trace.append(
        TraceStep(
            state=RuntimeState.SIMULATE,
            action="Generate what-if discharge scenarios and empathy prompts.",
            inputs=["scores", "case context"],
            outputs=[s.name for s in scenarios],
            checks=["generated media is non-authoritative", "scenario assumptions explicit"],
        )
    )

    recommendation = handoff(case, scores, checks)
    trace.append(
        TraceStep(
            state=RuntimeState.OUTPUT,
            action="Produce structured human handoff.",
            inputs=["scores", "checks", "scenarios"],
            outputs=[recommendation.disposition],
            checks=["clinician sign-off required", "red flags surfaced", "actions are considerations, not orders"],
        )
    )

    event = memory_event(
        case,
        None,
        artifacts={
            "instrument_names": [i.name for i in instruments],
            "score_bands": {s.name: s.band for s in scores},
            "scenario_names": [s.name for s in scenarios],
            "handoff_disposition": recommendation.disposition,
        },
    )

    result = RuntimeResult(
        patient_id=case.patient_id,
        instruments=instruments,
        trace=trace,
        scores=scores,
        scenarios=scenarios,
        handoff=recommendation,
        institutional_memory_event=event,
    )
    if memory_dir:
        append_memory(memory_dir, event)
    return result

