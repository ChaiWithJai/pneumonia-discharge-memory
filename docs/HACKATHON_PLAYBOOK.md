# Hackathon Playbook

This repo is structured to work at an Out-of-Pocket-style health hackathon.

## One-Hour Build Path

1. Run the sample case.
2. Add a new synthetic pneumonia patient.
3. Add one new instrument or what-if scenario.
4. Generate a handoff.
5. Show the institutional memory event.

## Suggested Tracks

- Pulmonary service line workflow.
- Patient empathy visualization.
- Discharge handoff quality.
- Local AI for healthcare operations.
- Institutional memory for clinical operations.

## Demo Script

```bash
pdm-run examples/patients/pneumonia_case_001.json --memory-dir examples/memory
pdm-run examples/patients/pneumonia_case_001.json --json
```

## What To Build Next

- Simple web UI with a worklist.
- Bonsai Image prompt runner.
- What-if chart renderer.
- COPD reuse example.
- Evaluation rubric for handoff quality.

