from pathlib import Path

from pdm.memory import read_memory
from pdm.proof import prove_case
from pdm.runtime import run
from pdm.schemas import PatientCase, RuntimeState


def load_case() -> PatientCase:
    return PatientCase.model_validate_json(Path("examples/patients/pneumonia_case_001.json").read_text())


def test_runtime_emits_all_states(tmp_path):
    result = run(load_case(), memory_dir=tmp_path)
    states = [step.state for step in result.trace]
    assert states == [
        RuntimeState.FACTORY,
        RuntimeState.PLAN,
        RuntimeState.ANALYZE,
        RuntimeState.SIMULATE,
        RuntimeState.OUTPUT,
    ]
    assert result.handoff.required_human_review is True
    assert len(result.scenarios) == 3


def test_high_risk_case_routes_to_review():
    result = run(load_case())
    assert result.handoff.disposition == "clinician_review_required"
    assert result.handoff.red_flags
    assert any(score.band == "high" for score in result.scores)


def test_memory_event_persists_future_reuse_targets(tmp_path):
    result = run(load_case(), memory_dir=tmp_path)
    events = read_memory(tmp_path)
    assert len(events) == 1
    event = events[0]
    assert event["service_line"] == "pulmonary"
    assert "copd_flare_up" in event["future_reuse_targets"]
    assert "frailty_index_calculator" in event["reusable_assets"]
    assert result.institutional_memory_event["domain"] == "pneumonia_discharge"


def test_homer1_proof_covers_entire_runtime(tmp_path):
    proof = prove_case(load_case(), memory_dir=tmp_path)
    assert proof["passed"] is True
    assert proof["criteria_passed"] == proof["criteria_total"]

    criteria_by_id = {criterion["id"]: criterion for criterion in proof["criteria"]}
    assert set(criteria_by_id) == {
        "factory.generative-toolchain",
        "factory.validation-declarations",
        "plan.trace-decomposition",
        "analyze.deterministic-probabilistic-fusion",
        "analyze.recursive-validation-loop",
        "simulate.whatif-operations",
        "simulate.empathy-with-guardrails",
        "output.decision-ready-human-handoff",
        "persist.institutional-memory",
        "governance.synthetic-safety-boundary",
        "runtime.governed-state-order",
    }
    assert criteria_by_id["runtime.governed-state-order"]["evidence"] == [
        "factory",
        "plan",
        "analyze",
        "simulate",
        "output",
    ]
    assert criteria_by_id["persist.institutional-memory"]["evidence"]["service_line"] == "pulmonary"
