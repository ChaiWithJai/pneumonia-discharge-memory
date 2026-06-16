# Research Notes

This project is grounded in public clinical operations concepts and the HOMER-1 framing from the DART technical overview.

## HOMER-1 Framing

Key ideas used:

- Healthcare has an action problem, not only a data problem.
- HOMER-1 is positioned as a stateful clinical reasoning runtime.
- The five states are Factory, Plan, Analyze, Simulate, and Output.
- State persistence creates institutional intelligence over time.
- Governance, observability, provenance, and human handoff are part of the architecture.

Source: DART HOMER-1 technical overview, `https://www.darthealth.ai/whitepaper/homer1`.

## Pneumonia Discharge Basis

Public sources motivating the demo:

- CMS Hospital Readmissions Reduction Program includes pneumonia among 30-day readmission measures.
- AHRQ patient-safety materials describe discharge and care transitions as high-risk periods where medication reconciliation, education, follow-up, and home support matter.
- IDSA/ATS community-acquired pneumonia guidance discusses clinical stability and safe discharge environment concepts.

The demo does not implement guideline recommendations. It models how a runtime could represent discharge-readiness reasoning, safety boundaries, and handoff traceability.

## Local AI Basis

Local AI patterns used:

- `bonsai`: local OpenAI-compatible text generation with Ternary-Bonsai via `llama-server`.
- `Bonsai-Image-Demo`: local image generation through Bonsai Image / mflux-style server workflow.
- `whatif`: branchable scene and "what-if" exploration model.

The new repo depends on none of those repos at runtime. It borrows their design pattern: local generation is an optional adapter, while the core workflow remains deterministic and testable.

