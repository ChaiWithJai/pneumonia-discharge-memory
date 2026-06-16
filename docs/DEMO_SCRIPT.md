# Demo Script

## Setup

```bash
make install
```

## Run The Pneumonia Case

```bash
make demo
```

Expected result:

- Frailty risk is high.
- Environmental medication access risk is high.
- Secondary infection risk is moderate.
- The handoff routes to clinician review.
- Institutional memory is appended.

## Inspect JSON

```bash
make json
```

The JSON includes:

- Instruments.
- State trace.
- Scores.
- What-if scenarios.
- Handoff.
- Institutional memory event.

## Explain The Product

Say:

"This is a synthetic reference workflow for pneumonia discharge readiness. The point is not the score. The point is the stateful operating model: build instruments, plan the trace, analyze with checks, simulate alternatives, output a human handoff, and persist the reusable assets."

## Show The What-If Layer

Point to `scenarios` in the output JSON.

Each scenario has:

- Explicit assumption.
- Risk delta.
- Empathy image prompt.
- Operational trigger.

## Show Institutional Memory

```bash
cat examples/memory/institutional_memory.jsonl | tail -1 | python3 -m json.tool
```

Emphasize:

- `service_line: pulmonary`
- `domain: pneumonia_discharge`
- reusable assets
- future reuse targets

