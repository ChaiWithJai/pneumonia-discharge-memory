# Source Alignment

## Local Source: `in-house-ml.md`

The local brief scoped pneumonia discharge tooling around:

- Pulmonary service line.
- Pneumonia readmission risk.
- Premature discharge.
- Secondary infection.
- Frailty.
- Environmental and medication compliance factors.
- Discharge readiness.
- Institutional memory for pulmonary operations and later COPD workflows.

This repo implements those concepts as:

- `frailty_index_calculator`
- `secondary_infection_risk_classifier`
- `environmental_medication_access_rules`
- `whatif_discharge_scenarios`
- `structured_human_handoff_template`
- `institutional_memory.jsonl`

## HOMER-1 Source Alignment

The runtime maps the HOMER-1 states into code:

- Factory: `factory.assemble()` (generate-or-reuse executable instruments)
- Plan: `plan_trace()`
- Analyze: `AssembledFactory.score()` and `recursive_validation()`
- Simulate: `generate_whatif_scenarios()`
- Output: `handoff()`
- Persist: `InstitutionalMemory.record_case()` and persisted tool artifacts

## Local AI Source Alignment

The local repo scan identified:

- `bonsai`: local text generation through `llama-server`.
- `Bonsai-Image-Demo`: local image generation through a served image studio.
- `whatif`: branchable scene / what-if exploration architecture.

This repo keeps those as optional adapters because clinical trace correctness should not depend on image or language generation.

