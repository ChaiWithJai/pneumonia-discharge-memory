from pathlib import Path

from pdm.memory import InstitutionalMemory
from pdm.runtime import run
from pdm.schemas import PatientCase, RuntimeState


def load_case(name: str = "pneumonia_case_001.json") -> PatientCase:
    return PatientCase.model_validate_json(Path(f"examples/patients/{name}").read_text())


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
    assert result.analyze_iterations >= 1


def test_high_risk_case_routes_to_review(tmp_path):
    result = run(load_case(), memory_dir=tmp_path)
    assert result.handoff.disposition == "clinician_review_required"
    assert result.handoff.red_flags
    assert any(score.band == "high" for score in result.scores)


def test_generated_scores_match_reference(tmp_path):
    result = run(load_case(), memory_dir=tmp_path)
    by_name = {s.name: s for s in result.scores}
    assert by_name["frailty_index"].value == 0.8
    assert by_name["frailty_index"].band == "high"
    assert by_name["secondary_infection_risk"].value == 0.64
    assert by_name["environmental_medication_access_risk"].value == 0.88


def test_factory_generates_then_reuses(tmp_path):
    memory = InstitutionalMemory(tmp_path)
    first = run(load_case(), memory=memory)
    assert first.factory_report.engineering_steps_this_run == 3
    assert first.factory_report.tools_reused == []
    # The generated source is a real, persisted, runnable artifact.
    tool = tmp_path / "tools" / "frailty_index_calculator@0.2.0.py"
    assert tool.exists()
    assert "def score(values):" in tool.read_text()

    second = run(load_case(), memory=memory)
    assert second.factory_report.engineering_steps_this_run == 0
    assert second.factory_report.engineering_steps_saved == 3
    assert second.run_index == 2


def test_low_risk_routes_differently(tmp_path):
    high = run(load_case("pneumonia_case_001.json"), memory_dir=tmp_path / "a")
    low = run(load_case("pneumonia_case_002_low_risk.json"), memory_dir=tmp_path / "b")
    assert high.handoff.disposition != low.handoff.disposition
    assert all(s.band == "low" for s in low.scores)


def test_missing_data_triggers_completeness_check(tmp_path):
    result = run(load_case("pneumonia_case_003_missing_data.json"), memory_dir=tmp_path)
    analyze = next(s for s in result.trace if s.state == RuntimeState.ANALYZE)
    assert any("data gap" in c for c in analyze.checks)


def test_memory_event_persists_future_reuse_targets(tmp_path):
    result = run(load_case(), memory_dir=tmp_path)
    event = result.institutional_memory_event
    assert event["service_line"] == "pulmonary"
    assert "copd_flare_up" in event["future_reuse_targets"]
    assert event["domain"] == "pneumonia_discharge"
