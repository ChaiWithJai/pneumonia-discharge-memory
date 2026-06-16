from __future__ import annotations

from .schemas import EvidenceItem, Instrument, PatientCase, Score


def factory_instruments() -> list[Instrument]:
    return [
        Instrument(
            name="frailty_index_calculator",
            version="0.1.0-demo",
            purpose="Estimate discharge fragility from mobility, nutrition, age, and recent utilization.",
            inputs=["age", "mobility.current_mobility_drop", "mobility.falls_last_6_months", "mobility.nutrition_risk", "prior_admissions_6_months"],
            validation_checks=["bounded score 0-1", "monotonic mobility penalty", "review high-frailty cases"],
            limitations=["Synthetic scoring only", "Not clinically validated", "Requires local calibration before real use"],
        ),
        Instrument(
            name="secondary_infection_risk_classifier",
            version="0.1.0-demo",
            purpose="Flag unresolved infection concern from WBC trajectory, procalcitonin trend, cultures, and vitals.",
            inputs=["labs.wbc_current", "labs.wbc_48h_delta", "labs.procalcitonin_trend", "labs.cultures_pending", "vitals.afebrile_hours"],
            validation_checks=["borderline values force clinician review", "culture-pending state preserved", "rising inflammatory markers increase risk"],
            limitations=[
                "Synthetic rule-based demo",
                "Not clinically validated",
                "No antimicrobial recommendation",
                "No replacement for infectious disease review",
            ],
        ),
        Instrument(
            name="environmental_medication_access_rules",
            version="0.1.0-demo",
            purpose="Represent non-clinical discharge risks that drive avoidable readmission.",
            inputs=["social.zip_code", "social.pharmacy_access_minutes", "social.caregiver_available", "meds.med_access_risk", "meds.adherence_concern"],
            validation_checks=["no protected-class inference", "explain each access-risk flag", "route high access risk to support planning"],
            limitations=[
                "Synthetic zip-code placeholder",
                "Not clinically validated",
                "Requires vetted SDOH data and fairness review",
            ],
        ),
    ]


def band(value: float) -> str:
    if value >= 0.67:
        return "high"
    if value >= 0.34:
        return "moderate"
    return "low"


def frailty_score(case: PatientCase) -> Score:
    value = 0.0
    evidence: list[EvidenceItem] = []

    if case.age >= 80:
        value += 0.2
        evidence.append(EvidenceItem(key="age", value=case.age, source="synthetic case", interpretation="Age contributes to frailty burden."))
    elif case.age >= 70:
        value += 0.1

    mobility_weights = {"none": 0.0, "mild": 0.12, "moderate": 0.26, "severe": 0.4}
    mobility = mobility_weights[case.mobility.current_mobility_drop]
    value += mobility
    evidence.append(
        EvidenceItem(
            key="mobility_drop",
            value=case.mobility.current_mobility_drop,
            source="synthetic mobility assessment",
            interpretation="Mobility decline is a discharge support signal.",
        )
    )

    value += min(case.mobility.falls_last_6_months * 0.06, 0.18)
    value += {"low": 0.0, "moderate": 0.08, "high": 0.16}[case.mobility.nutrition_risk]
    value += min(case.prior_admissions_6_months * 0.06, 0.18)

    value = min(round(value, 3), 1.0)
    return Score(name="frailty_index", value=value, band=band(value), evidence=evidence)


def secondary_infection_score(case: PatientCase) -> Score:
    value = 0.0
    evidence: list[EvidenceItem] = []

    if case.labs.wbc_current >= 14:
        value += 0.22
    if case.labs.wbc_48h_delta > 1.0:
        value += 0.24
        evidence.append(EvidenceItem(key="wbc_48h_delta", value=case.labs.wbc_48h_delta, source="synthetic labs", interpretation="Rising WBC triggers recursive review."))
    if case.labs.procalcitonin_trend == "rising":
        value += 0.24
    elif case.labs.procalcitonin_trend == "flat":
        value += 0.1
    if case.labs.cultures_pending:
        value += 0.12
    if case.vitals.afebrile_hours < 48:
        value += 0.18
        evidence.append(EvidenceItem(key="afebrile_hours", value=case.vitals.afebrile_hours, source="synthetic vitals", interpretation="Clinical stability should be reviewed before discharge."))

    value = min(round(value, 3), 1.0)
    return Score(name="secondary_infection_risk", value=value, band=band(value), evidence=evidence)


def environmental_score(case: PatientCase) -> Score:
    value = 0.0
    evidence: list[EvidenceItem] = []

    if case.meds.med_access_risk == "high":
        value += 0.28
    elif case.meds.med_access_risk == "moderate":
        value += 0.14
    if case.meds.adherence_concern:
        value += 0.2
    if case.social.pharmacy_access_minutes > 30:
        value += 0.16
        evidence.append(EvidenceItem(key="pharmacy_access_minutes", value=case.social.pharmacy_access_minutes, source="synthetic SDOH", interpretation="Medication access may require support."))
    if case.social.lives_alone and not case.social.caregiver_available:
        value += 0.16
    if case.social.health_literacy_risk == "high":
        value += 0.16
    elif case.social.health_literacy_risk == "moderate":
        value += 0.08

    value = min(round(value, 3), 1.0)
    return Score(name="environmental_medication_access_risk", value=value, band=band(value), evidence=evidence)


def score_case(case: PatientCase) -> list[Score]:
    return [frailty_score(case), secondary_infection_score(case), environmental_score(case)]
