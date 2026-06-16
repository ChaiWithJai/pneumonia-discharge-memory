from pathlib import Path

from pdm.proof import prove_case, prove_cohort
from pdm.schemas import PatientCase


def load_case(name: str) -> PatientCase:
    return PatientCase.model_validate_json(Path(f"examples/patients/{name}").read_text())


def test_single_case_proves_all_criteria(tmp_path):
    proof = prove_case(load_case("pneumonia_case_001.json"), memory_dir=tmp_path)
    assert proof["passed"] is True
    assert proof["criteria_passed"] == proof["criteria_total"]

    by_id = {c["id"]: c for c in proof["criteria"]}
    # The differentiators that a tautology cannot fake:
    assert by_id["factory.generative-source"]["passed"] is True
    assert by_id["factory.generative-source"]["evidence"]["compiles_and_matches_reference"] is True
    assert by_id["factory.stateful-acceleration"]["evidence"]["run2"]["engineering_steps_saved"] == 3
    assert by_id["analyze.recursive-validation-loop"]["evidence"]["iterations"] >= 1


def test_cohort_proves_differentiated_routing_and_reuse(tmp_path):
    cases = [
        load_case("pneumonia_case_001.json"),
        load_case("pneumonia_case_002_low_risk.json"),
        load_case("pneumonia_case_003_missing_data.json"),
    ]
    proof = prove_cohort(cases, memory_dir=tmp_path)
    assert proof["passed"] is True
    # First case generates; the rest reuse one shared, persisted toolset.
    assert len(set(proof["dispositions"].values())) >= 2


def test_public_proof_artifact_matches_contract():
    artifact = Path("examples/pneumonia_case_001_homer1_proof.json")
    assert artifact.exists()
    text = artifact.read_text(encoding="utf-8")
    assert '"passed": true' in text
    assert '"framework": "HOMER-1-inspired governed clinical reasoning runtime"' in text
    assert "factory.generative-source" in text
