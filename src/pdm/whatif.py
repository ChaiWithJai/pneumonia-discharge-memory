from __future__ import annotations

from .schemas import PatientCase, Score, WhatIfScenario


def _score(scores: list[Score], name: str) -> Score:
    return next(s for s in scores if s.name == name)


def generate_whatif_scenarios(case: PatientCase, scores: list[Score]) -> list[WhatIfScenario]:
    frailty = _score(scores, "frailty_index").value
    infection = _score(scores, "secondary_infection_risk").value
    environment = _score(scores, "environmental_medication_access_risk").value
    base_pressure = round((frailty + infection + environment) / 3, 3)

    return [
        WhatIfScenario(
            name="discharge_today_no_added_support",
            assumption="Patient leaves today with standard instructions only.",
            readmission_risk_delta=round(base_pressure * 0.22, 3),
            empathy_prompt=(
                "Create a respectful discharge-day image: an older adult at home after pneumonia, "
                "medications on a kitchen table, visible fatigue, and a phone reminder for follow-up. "
                "No fear tactics, no identifiable patient likeness, no medical gore."
            ),
            operational_trigger="Require clinician review if any individual risk band is high.",
        ),
        WhatIfScenario(
            name="delay_24h_reassess",
            assumption="Discharge is delayed 24 hours for mobility reassessment, lab trend review, and oral antibiotic confirmation.",
            readmission_risk_delta=round(-0.12 if infection >= 0.34 or frailty >= 0.34 else -0.04, 3),
            empathy_prompt=(
                "Create a calm hospital-room planning image: clinician and patient reviewing a discharge checklist, "
                "with mobility support and medication plan visible."
            ),
            operational_trigger="Re-run Analyze after updated vitals, labs, and mobility assessment.",
        ),
        WhatIfScenario(
            name="discharge_with_medication_and_home_support",
            assumption="Patient leaves with medication delivery confirmation, teach-back, and home health or caregiver support.",
            readmission_risk_delta=round(-0.18 if environment >= 0.34 else -0.07, 3),
            empathy_prompt=(
                "Create an optimistic home-transition image: medication delivery bag, caregiver checklist, "
                "and patient resting safely with clear follow-up instructions."
            ),
            operational_trigger="Route to care management for access support and post-discharge follow-up.",
        ),
    ]

