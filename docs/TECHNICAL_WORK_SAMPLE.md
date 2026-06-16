# Technical Work Sample

This repository is designed to demonstrate senior engineering judgment in clinical AI infrastructure.

It is intentionally not a polished demo app. It is a reference implementation that makes architecture, safety boundaries, governance, and extension points visible.

## What This Proves

### 1. Product Understanding

The repo starts from the service-line operator's problem: pneumonia discharge risk is not a generic prediction task. It is an operational workflow where frailty, infection trajectory, medication access, home support, and clinician handoff all matter.

### 2. Systems Thinking

The runtime separates:

- Deterministic scoring path.
- Trace generation.
- Simulation assumptions.
- Human handoff.
- Institutional memory.
- Optional AI-generated text or images.

That separation is deliberate. A clinical AI system should be inspectable before it is impressive.

### 3. Governance By Design

Safety is not a footer. It appears in:

- Typed schemas.
- Explicit non-goals.
- Synthetic-data-only policy.
- Human sign-off requirement.
- Memory events that preserve traceability.
- Tests for routing and persistence.

### 4. Local AI Pragmatism

The project integrates the idea of local text and image generation without making generation authoritative. The deterministic runtime can be tested offline. Local models can augment the user experience, empathy layer, or scenario explanation later.

### 5. Platform Reuse

The first use case is pneumonia discharge readiness. The product move is to preserve reusable tools and operating patterns for pulmonary workflows such as COPD flare-ups, asthma exacerbations, and post-discharge medication adherence.

## Why The Scope Is Narrow

The narrow scope is the point.

A broad clinical AI repo would be easy to overclaim and hard to verify. Pneumonia discharge readiness is specific enough to model as an end-to-end workflow while still proving the platform idea:

```text
one workflow -> reusable assets -> service-line memory -> next workflow
```

## What A Production Version Would Need

- Real clinical governance.
- Institution-specific protocol configuration.
- Retrospective validation.
- Prospective silent-mode validation.
- PHI-safe data layer.
- Role-based access controls.
- Human-in-the-loop review UI.
- Bias and fairness review.
- Full observability, audit, and incident response.

## What A Hackathon Version Can Build

- Worklist UI.
- Scenario chart renderer.
- Bonsai Image prompt runner.
- COPD reuse example.
- Clinician handoff quality evaluator.
- Synthetic memory browser.

