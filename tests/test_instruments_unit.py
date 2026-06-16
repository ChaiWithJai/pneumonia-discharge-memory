from pathlib import Path

from pdm.instruments import environmental_score, factory_instruments, frailty_score, secondary_infection_score
from pdm.schemas import PatientCase


def load_case() -> PatientCase:
    return PatientCase.model_validate_json(Path("examples/patients/pneumonia_case_001.json").read_text())


def test_factory_instruments_are_declared_with_validation_and_limits():
    instruments = factory_instruments()
    assert [instrument.name for instrument in instruments] == [
        "frailty_index_calculator",
        "secondary_infection_risk_classifier",
        "environmental_medication_access_rules",
    ]
    assert all(instrument.validation_checks for instrument in instruments)
    assert all(instrument.limitations for instrument in instruments)


def test_frailty_score_flags_high_risk_synthetic_case():
    score = frailty_score(load_case())
    assert score.name == "frailty_index"
    assert score.value == 0.8
    assert score.band == "high"
    assert any(item.key == "mobility_drop" for item in score.evidence)


def test_secondary_infection_score_preserves_pending_culture_signal():
    score = secondary_infection_score(load_case())
    assert score.name == "secondary_infection_risk"
    assert score.value == 0.64
    assert score.band == "moderate"
    assert any(item.key == "afebrile_hours" for item in score.evidence)


def test_environmental_score_flags_medication_access_risk():
    score = environmental_score(load_case())
    assert score.name == "environmental_medication_access_risk"
    assert score.value == 0.88
    assert score.band == "high"
    assert any(item.key == "pharmacy_access_minutes" for item in score.evidence)
