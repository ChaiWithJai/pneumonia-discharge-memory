"""Mock data lake — the bridge between the care team (in the room) and the data team.

In production this is a query against the warehouse; here it returns deterministic,
synthetic outcomes for the demo cohort so the case conference's "reckon with the
data" moment is real and reproducible. The single interface `outcome_for(case_id)`
is the clean swap point for a real lake. No PHI.
"""

from __future__ import annotations

from .schemas import Outcome

# Curated outcomes for the synthetic cohort. The high-risk, lives-alone case is
# readmitted (the humbling reveal); the low-risk case is not; the borderline
# missing-data case is readmitted later — three honestly different endings.
_OUTCOMES: dict[str, Outcome] = {
    "synthetic-pna-001": Outcome(
        patient_id="synthetic-pna-001",
        readmitted_30d=True,
        days_to_readmit=9,
        length_of_stay_days=3,
        followup_kept=False,
    ),
    "synthetic-pna-002-low-risk": Outcome(
        patient_id="synthetic-pna-002-low-risk",
        readmitted_30d=False,
        days_to_readmit=None,
        length_of_stay_days=2,
        followup_kept=True,
    ),
    "synthetic-pna-003-missing-data": Outcome(
        patient_id="synthetic-pna-003-missing-data",
        readmitted_30d=True,
        days_to_readmit=14,
        length_of_stay_days=3,
        followup_kept=True,
    ),
}


def outcome_for(case_id: str) -> Outcome:
    """Return the (mock) 30-day outcome for a case.

    Unknown cases get a deterministic fallback derived from the id so the demo
    never dead-ends — clearly still synthetic.
    """
    if case_id in _OUTCOMES:
        return _OUTCOMES[case_id]
    readmitted = sum(ord(c) for c in case_id) % 2 == 0
    return Outcome(
        patient_id=case_id,
        readmitted_30d=readmitted,
        days_to_readmit=11 if readmitted else None,
        length_of_stay_days=3,
        followup_kept=not readmitted,
        source="mock_data_lake_fallback",
    )


def known_cases() -> list[str]:
    return list(_OUTCOMES)
