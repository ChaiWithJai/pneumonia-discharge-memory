"""The governed runtime: Factory -> Plan -> Analyze -> Simulate -> Output -> Persist.

The runtime reads institutional memory *before* it reasons, assembles (reuses or
generates) its instruments, scores the case, runs a recursive validation loop to a
fixed point, simulates discharge alternatives, and produces a human handoff. Every
state appends an auditable TraceStep. Persistence is part of the contract, not an
afterthought — that is what lets the next run be cheaper than this one.
"""

from __future__ import annotations

from pathlib import Path

from .factory import OBJECTIVE, assemble
from .memory import InstitutionalMemory, case_event
from .schemas import (
    HandoffRecommendation,
    PatientCase,
    RuntimeResult,
    RuntimeState,
    Score,
    TraceStep,
)
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


def recursive_validation(scores: list[Score], case: PatientCase, max_iters: int = 4) -> tuple[list[str], int]:
    """Apply validation passes until no new finding fires (a real fixed point)."""
    checks: list[str] = []

    def add(msg: str) -> None:
        if msg not in checks:
            checks.append(msg)

    iterations = 0
    prev_len = -1
    while len(checks) != prev_len and iterations < max_iters:
        prev_len = len(checks)
        iterations += 1
        for score in scores:
            if score.band == "high":
                add(f"{score.name} high: force clinician_review_required.")
            if score.name == "secondary_infection_risk" and score.value >= 0.34 and case.labs.cultures_pending:
                add("Infection risk borderline/high with pending cultures: re-evaluate before final handoff.")
            if score.name == "environmental_medication_access_risk" and score.value >= 0.34:
                add("Access risk elevated: verify medication-in-hand or delivery before discharge.")
        if case.labs.procalcitonin_trend == "unknown":
            add("Procalcitonin trend unknown: flag data gap for clinician completeness review.")
        if case.vitals.oxygen_saturation_room_air < 92:
            add("Room-air SpO2 below 92%: confirm oxygenation stability before discharge.")
    if not checks:
        checks.append("No high-risk recursive checks triggered in synthetic scoring path.")
    return checks, iterations


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


def run(
    case: PatientCase,
    memory: InstitutionalMemory | None = None,
    memory_dir: Path | None = None,
    designer: object | None = None,
) -> RuntimeResult:
    if memory is None:
        memory = InstitutionalMemory(memory_dir) if memory_dir else InstitutionalMemory(Path("examples/memory/institutional"))

    trace: list[TraceStep] = []

    factory = assemble(case, memory, designer=designer)
    fr = factory.report
    trace.append(
        TraceStep(
            state=RuntimeState.FACTORY,
            action="Assemble pneumonia discharge instruments via generative toolchain (reuse-or-generate).",
            inputs=["clinical objective", "synthetic case schema", "institutional memory"],
            outputs=[i.name for i in factory.instruments()],
            checks=[
                f"objective: {OBJECTIVE}",
                f"generated this run: {fr.tools_generated or 'none'}",
                f"reused from memory: {fr.tools_reused or 'none'}",
                f"engineering steps saved this run: {fr.engineering_steps_saved}",
                "each tool validated (bounded score, zero-input -> 0) before use",
            ],
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

    scores = factory.score(case)
    checks, iterations = recursive_validation(scores, case)
    trace.append(
        TraceStep(
            state=RuntimeState.ANALYZE,
            action=f"Score risk and run recursive validation loop to fixed point ({iterations} iterations).",
            inputs=[s.name for s in scores],
            outputs=[f"{s.name}:{s.band}:{s.value}" for s in scores],
            checks=checks,
        )
    )

    scenarios = generate_whatif_scenarios(case, scores)
    trace.append(
        TraceStep(
            state=RuntimeState.SIMULATE,
            action="Generate what-if discharge scenarios and empathy image prompts.",
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

    event = case_event(
        case.patient_id,
        fr.run_index,
        memory.service_line,
        artifacts={
            "instrument_names": [i.name for i in factory.instruments()],
            "score_bands": {s.name: s.band for s in scores},
            "scenario_names": [s.name for s in scenarios],
            "handoff_disposition": recommendation.disposition,
            "tools_generated": fr.tools_generated,
            "tools_reused": fr.tools_reused,
            "engineering_steps_saved": fr.engineering_steps_saved,
            "analyze_iterations": iterations,
        },
    )
    memory.record_case(event)

    return RuntimeResult(
        patient_id=case.patient_id,
        run_index=fr.run_index,
        instruments=factory.instruments(),
        factory_report=fr,
        trace=trace,
        scores=scores,
        analyze_iterations=iterations,
        scenarios=scenarios,
        handoff=recommendation,
        institutional_memory_event=event,
    )
