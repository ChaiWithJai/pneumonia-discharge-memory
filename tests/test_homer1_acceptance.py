from pathlib import Path

from pdm.proof import prove_case
from pdm.schemas import PatientCase


def load_case() -> PatientCase:
    return PatientCase.model_validate_json(Path("examples/patients/pneumonia_case_001.json").read_text())


def test_acceptance_pneumonia_case_proves_all_homer1_criteria(tmp_path):
    proof = prove_case(load_case(), memory_dir=tmp_path)

    assert proof["passed"] is True
    assert proof["criteria_passed"] == 11
    assert proof["criteria_total"] == 11
    assert proof["result"]["handoff"]["disposition"] == "clinician_review_required"
    assert proof["result"]["institutional_memory_event"]["service_line"] == "pulmonary"
    assert proof["result"]["trace"][0]["state"] == "factory"
    assert proof["result"]["trace"][-1]["state"] == "output"


def test_acceptance_proof_artifact_matches_public_example_contract():
    artifact = Path("examples/pneumonia_case_001_homer1_proof.json")
    assert artifact.exists()

    proof = artifact.read_text(encoding="utf-8")
    assert '"passed": true' in proof
    assert '"criteria_passed": 11' in proof
    assert '"criteria_total": 11' in proof
    assert '"framework": "HOMER-1-inspired governed clinical reasoning runtime"' in proof
