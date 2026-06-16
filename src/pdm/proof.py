from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .memory import read_memory
from .runtime import run
from .schemas import PatientCase, RuntimeResult, RuntimeState


@dataclass(frozen=True)
class Criterion:
    id: str
    state: RuntimeState | str
    claim: str
    evidence_path: str
    passed: bool
    evidence: Any


def _step(result: RuntimeResult, state: RuntimeState):
    return next((step for step in result.trace if step.state == state), None)


def _criterion(
    *,
    id: str,
    state: RuntimeState | str,
    claim: str,
    evidence_path: str,
    passed: bool,
    evidence: Any,
) -> Criterion:
    return Criterion(id=id, state=state, claim=claim, evidence_path=evidence_path, passed=passed, evidence=evidence)


def prove_case(case: PatientCase, memory_dir: Path) -> dict[str, Any]:
    result = run(case, memory_dir=memory_dir)
    memory_events = read_memory(memory_dir)

    factory = _step(result, RuntimeState.FACTORY)
    plan = _step(result, RuntimeState.PLAN)
    analyze = _step(result, RuntimeState.ANALYZE)
    simulate = _step(result, RuntimeState.SIMULATE)
    output = _step(result, RuntimeState.OUTPUT)

    instrument_names = {instrument.name for instrument in result.instruments}
    score_names = {score.name for score in result.scores}
    scenario_names = {scenario.name for scenario in result.scenarios}
    memory_event = result.institutional_memory_event

    criteria = [
        _criterion(
            id="factory.generative-toolchain",
            state=RuntimeState.FACTORY,
            claim="Factory constructs reusable clinical instruments for the pneumonia discharge use case.",
            evidence_path="result.instruments[*].name",
            passed={
                "frailty_index_calculator",
                "secondary_infection_risk_classifier",
                "environmental_medication_access_rules",
            }.issubset(instrument_names)
            and factory is not None
            and "Construct pneumonia discharge instruments." in factory.action,
            evidence=sorted(instrument_names),
        ),
        _criterion(
            id="factory.validation-declarations",
            state=RuntimeState.FACTORY,
            claim="Every generated instrument declares validation checks and limitations before use.",
            evidence_path="result.instruments[*].validation_checks + limitations",
            passed=all(instrument.validation_checks and instrument.limitations for instrument in result.instruments),
            evidence=[
                {
                    "name": instrument.name,
                    "validation_checks": instrument.validation_checks,
                    "limitations": instrument.limitations,
                }
                for instrument in result.instruments
            ],
        ),
        _criterion(
            id="plan.trace-decomposition",
            state=RuntimeState.PLAN,
            claim="Plan decomposes the discharge decision into auditable clinical, operational, and support checks.",
            evidence_path="trace[plan].outputs",
            passed=plan is not None
            and len(plan.outputs) >= 6
            and any("afebrile" in item.lower() for item in plan.outputs)
            and any("medication access" in item.lower() for item in plan.outputs)
            and any("home support" in item.lower() or "care-management" in item.lower() for item in plan.outputs),
            evidence=plan.outputs if plan else None,
        ),
        _criterion(
            id="analyze.deterministic-probabilistic-fusion",
            state=RuntimeState.ANALYZE,
            claim="Analyze fuses deterministic rules and bounded risk scores into explainable patient-level findings.",
            evidence_path="result.scores[*]",
            passed={
                "frailty_index",
                "secondary_infection_risk",
                "environmental_medication_access_risk",
            }.issubset(score_names)
            and all(0 <= score.value <= 1 for score in result.scores)
            and all(score.band in {"low", "moderate", "high"} for score in result.scores),
            evidence=[score.model_dump(mode="json") for score in result.scores],
        ),
        _criterion(
            id="analyze.recursive-validation-loop",
            state=RuntimeState.ANALYZE,
            claim="Recursive validation catches borderline or high-risk signals before final handoff.",
            evidence_path="trace[analyze].checks",
            passed=analyze is not None
            and any("force clinician_review_required" in check for check in analyze.checks)
            and any("pending cultures" in check for check in analyze.checks)
            and any("verify medication-in-hand" in check for check in analyze.checks),
            evidence=analyze.checks if analyze else None,
        ),
        _criterion(
            id="simulate.whatif-operations",
            state=RuntimeState.SIMULATE,
            claim="Simulate evaluates discharge timing and support alternatives with explicit operational triggers.",
            evidence_path="result.scenarios[*]",
            passed={
                "discharge_today_no_added_support",
                "delay_24h_reassess",
                "discharge_with_medication_and_home_support",
            }.issubset(scenario_names)
            and all(scenario.operational_trigger for scenario in result.scenarios)
            and any(scenario.readmission_risk_delta > 0 for scenario in result.scenarios)
            and any(scenario.readmission_risk_delta < 0 for scenario in result.scenarios),
            evidence=[scenario.model_dump(mode="json") for scenario in result.scenarios],
        ),
        _criterion(
            id="simulate.empathy-with-guardrails",
            state=RuntimeState.SIMULATE,
            claim="What-if image prompts drive discharge empathy without becoming clinical evidence.",
            evidence_path="result.scenarios[*].empathy_prompt + trace[simulate].checks",
            passed=simulate is not None
            and all(scenario.empathy_prompt for scenario in result.scenarios)
            and any("non-authoritative" in check for check in simulate.checks)
            and any("No fear tactics" in scenario.empathy_prompt or "No identifiable" in scenario.empathy_prompt for scenario in result.scenarios),
            evidence={
                "prompts": [scenario.empathy_prompt for scenario in result.scenarios],
                "checks": simulate.checks if simulate else None,
            },
        ),
        _criterion(
            id="output.decision-ready-human-handoff",
            state=RuntimeState.OUTPUT,
            claim="Output produces a decision-ready human handoff with red flags, actions, and mandatory clinician review.",
            evidence_path="result.handoff",
            passed=output is not None
            and result.handoff.required_human_review is True
            and result.handoff.disposition == "clinician_review_required"
            and bool(result.handoff.red_flags)
            and bool(result.handoff.actions_to_consider)
            and "clinician sign-off required" in output.checks,
            evidence=result.handoff.model_dump(mode="json"),
        ),
        _criterion(
            id="persist.institutional-memory",
            state=RuntimeState.PERSIST,
            claim="The run persists institutional memory for pulmonary service-line reuse, not just a one-off answer.",
            evidence_path="memory/institutional_memory.jsonl",
            passed=bool(memory_events)
            and memory_event.get("service_line") == "pulmonary"
            and memory_event.get("domain") == "pneumonia_discharge"
            and "copd_flare_up" in memory_event.get("future_reuse_targets", [])
            and "structured_human_handoff_template" in memory_event.get("reusable_assets", []),
            evidence=memory_events[-1] if memory_events else None,
        ),
        _criterion(
            id="governance.synthetic-safety-boundary",
            state="governance",
            claim="The use case preserves synthetic-only safety boundaries and avoids autonomous clinical orders.",
            evidence_path="instrument.limitations + result.handoff.clinician_note + memory_event.note",
            passed=all(any("Synthetic" in limitation or "validated" in limitation for limitation in instrument.limitations) for instrument in result.instruments)
            and "must validate" in result.handoff.clinician_note
            and "Do not store PHI" in memory_event.get("note", ""),
            evidence={
                "instrument_limitations": {instrument.name: instrument.limitations for instrument in result.instruments},
                "clinician_note": result.handoff.clinician_note,
                "memory_note": memory_event.get("note"),
            },
        ),
    ]

    state_order = [step.state.value for step in result.trace]
    required_order = [
        RuntimeState.FACTORY.value,
        RuntimeState.PLAN.value,
        RuntimeState.ANALYZE.value,
        RuntimeState.SIMULATE.value,
        RuntimeState.OUTPUT.value,
    ]
    criteria.append(
        _criterion(
            id="runtime.governed-state-order",
            state="runtime",
            claim="Runtime executes the governed HOMER-1 state order before persistence.",
            evidence_path="result.trace[*].state",
            passed=state_order == required_order,
            evidence=state_order,
        )
    )

    criteria_payload = [
        {
            "id": criterion.id,
            "state": criterion.state.value if isinstance(criterion.state, RuntimeState) else criterion.state,
            "claim": criterion.claim,
            "evidence_path": criterion.evidence_path,
            "passed": criterion.passed,
            "evidence": criterion.evidence,
        }
        for criterion in criteria
    ]
    passed = all(criterion.passed for criterion in criteria)

    return {
        "case_id": case.patient_id,
        "framework": "HOMER-1-inspired governed clinical reasoning runtime",
        "passed": passed,
        "criteria_passed": sum(1 for criterion in criteria if criterion.passed),
        "criteria_total": len(criteria),
        "criteria": criteria_payload,
        "result": result.model_dump(mode="json"),
    }
