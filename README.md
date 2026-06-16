# Pneumonia Discharge Memory

Open-source reference implementation for a HOMER-1-inspired pneumonia discharge readiness workflow.

This project is a professional demonstration of how a service-line clinical AI workload could move from raw chart context to a governed, auditable, empathy-aware discharge handoff while creating institutional memory for future pulmonary operations.

It is designed for:

- Service line leaders evaluating pneumonia readmission risk and discharge operations.
- Clinical AI builders designing stateful reasoning systems.
- Field operators who need to explain how Strategist-style population analysis can hand off into Drivetrain-style patient workload execution.
- Hackathon teams building health-system workflow prototypes with local AI.

## What This Is

This repo models a pulmonary service-line workflow:

```text
Pneumonia discharge objective
  -> Factory: build validated instruments
  -> Plan: decompose a discharge trace
  -> Analyze: score readiness with recursive checks
  -> Simulate: generate what-if scenarios
  -> Output: produce structured human handoff
  -> Persist: write institutional memory
```

The reference use case is pneumonia discharge readiness, with example instruments for:

- Frailty index.
- Secondary infection risk.
- Environmental and medication-access risk.
- What-if chart scenarios for discharge today vs. delayed discharge vs. medication support.
- Structured human handoff for clinician review.

## What This Is Not

This is not medical advice, clinical decision support, or a production healthcare system. It uses synthetic data and simplified scoring logic to demonstrate architecture, governance, observability, and product thinking. Real clinical deployment would require licensed clinical ownership, institutional validation, regulatory review, security controls, and rigorous model evaluation.

## Why This Exists

The central product idea is institutional memory.

Most AI demos answer a question and forget. A clinical operations platform should retain the tools, rules, traces, exceptions, outcomes, and human feedback produced by each workflow. Pneumonia discharge tooling should make the next pulmonary workflow, such as COPD flare-up management or post-discharge medication adherence, easier to launch and safer to inspect.

## Local Quick Start

```bash
cd /Users/jaybhagat/projects/pneumonia-discharge-memory
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pdm-run examples/patients/pneumonia_case_001.json --memory-dir examples/memory
pytest
```

## Optional Local AI Integrations

The core workflow is deterministic and runs without model keys.

Optional adapters are included for local generation:

- `bonsai_text`: OpenAI-compatible local text endpoint, aligned with the Bonsai `llama-server` setup.
- `bonsai_image`: local image generation server, aligned with Bonsai Image Demo / mflux-style generation.
- `whatif_scene`: structured empathy prompt generator inspired by the local `whatif` scene workflow.

These adapters are intentionally isolated. The core safety and scoring path does not depend on generated text or images.

## Repo Structure

```text
src/pdm/
  schemas.py              Typed clinical workflow objects
  instruments.py          Simplified validated instruments
  runtime.py              Five-state runtime
  memory.py               Institutional memory store
  whatif.py               What-if scenario generation
  local_ai.py             Optional local AI adapters
  cli.py                  Command-line entrypoint
docs/
  ARCHITECTURE.md
  CLINICAL_SAFETY.md
  FIELD_OPERATOR_MODEL.md
  HACKATHON_PLAYBOOK.md
  INSTITUTIONAL_MEMORY.md
  RESEARCH_NOTES.md
examples/
  patients/
  memory/
tests/
```

## Design Standard

The project is written as an open technical artifact, closer to a Linux Foundation or mature cloud ecosystem reference implementation than a pitch deck:

- Explicit scope and non-goals.
- Reproducible local run path.
- Typed interfaces.
- Deterministic tests.
- Governance and safety documentation.
- Extension points for local AI without making AI output authoritative.

## License

Apache-2.0. See [LICENSE](LICENSE).

