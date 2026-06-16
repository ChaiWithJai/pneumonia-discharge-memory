# Clinical Safety

This repository is a reference implementation and does not provide medical advice.

## Safety Principles

1. Human sign-off is always required.
2. Generated media is empathy support, not clinical evidence.
3. Scoring logic is synthetic and not clinically validated.
4. Every output must preserve traceability.
5. Every recommendation is framed as an action to consider, never an autonomous order.

## Reliability Checks

The demo includes three reliability categories:

- Correctness checks: bounded scores, monotonic risk contribution, explicit high-risk routing.
- Toxicity checks: no fear-based image prompts, no identifiable patient depictions, no protected-class inference.
- Governance checks: every run emits a trace and memory event.

## Deployment Requirements Not Included

A real deployment would require:

- Licensed clinical ownership.
- Validated local guidelines and protocol governance.
- Retrospective validation against institution-specific outcomes.
- Bias/fairness evaluation.
- Security review.
- HIPAA-grade audit, access controls, and tenancy.
- Regulatory and legal review.

