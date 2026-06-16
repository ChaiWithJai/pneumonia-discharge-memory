# Security Policy

This repository is a local prototype and does not process real patient data.

## Do Not Use With PHI

Do not run this project with protected health information. Synthetic examples only.

## Reporting Issues

Open a GitHub issue or contact the maintainer if you identify a security concern in the reference implementation.

## Threat Model

Primary risks:

- Accidental use with identifiable clinical data.
- Generated images or text misread as clinical truth.
- Unsafe extension into automated clinical action.
- Bias embedded in synthetic examples or scoring assumptions.

Mitigations:

- Explicit non-clinical scope.
- Deterministic scoring path.
- Human handoff requirement.
- Traceable evidence objects.
- Generated media segregated from decision payloads.

