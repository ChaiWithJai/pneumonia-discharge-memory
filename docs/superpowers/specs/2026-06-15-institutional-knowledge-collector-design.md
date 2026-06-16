# Institutional Knowledge Collector — Design Spec

- **Date:** 2026-06-15
- **Status:** Approved (design); pending implementation plan
- **Scope:** Extends the existing pneumonia-discharge HOMER-1 runtime with a facilitated *case-conference* experience that collects frontline judgment, reconciles it against a mocked data lake, compounds it into institutional memory, and exports Hamel-grade eval suites + RLHF preference data — graded across a four-layer knowledge chain.

---

## 1. Purpose

Bridge the divide between care teams and data teams. A service-line leader runs a discharge case conference with the people who do the work; their judgment becomes a durable, defensible standard **and** a value-add data product (evals + preference pairs), without a six-month data project. The Bonsai what-if imagery/prose is the emotional spine and the face of the exported teaching case.

This is a synthetic, non-clinical reference implementation (a work sample). No PHI; no autonomous clinical action.

## 2. Actors & Jobs-to-be-Done

| Actor | Job (when / want / so) | Krug law that makes it "done" |
|---|---|---|
| **Service-line leader** (primary) | When I run a session, I want to turn scattered judgment into one durable standard, so I can cut avoidable readmissions without a 6-month data project. | The trunk test — from any screen, know the step, the case, the next action. One primary action per stage. |
| **Frontline expert** (nurse/case mgr/pharmacist) | When the tool disagrees with my gut, I want my reasoning captured and weighed against real outcomes, so my expertise shapes the system. | "Don't make me think" + mindless choices — binary pass/fail + one-line why, zero training. |
| **The patient** (absent, but the point) | When my discharge is decided, I want the room to feel my situation, so the plan fits my life. | We scan, we don't read — a Bonsai what-if image lands empathy before prose. |
| **Data/AI team** (downstream) | When a session ends, I want labeled eval + preference data in a standard format, so I can improve the model without re-interviewing clinicians. | Omit needless words / satisficing — one obvious export, no config ceremony. |

**Usability contract (acceptance criteria):** self-evident screens; scannable hierarchy; the right action is the most prominent; every click mindless; no instructional paragraphs; conventional patterns everywhere except the empathy frames.

## 3. Service blueprint (the room)

Protagonist: pulmonary service-line leader + the room. Emotional arc: **curiosity → empathy → tension → humility → alignment → ownership/pride.** Six stages, each with frontstage (what the room sees) and backstage (HOMER-1 + Bonsai + memory/data-lake). See `.superpowers/brainstorm/.../service-blueprint.html` for the full lane diagram. Stages: ① Convene & recall, ② Present case, ③ Feel the what-ifs, ④ Judge (the room votes), ⑤ Reckon with the data lake, ⑥ Decide, compound & export.

## 4. The knowledge chain (spine, not a module)

A four-value enum tagged onto every persisted artifact (annotation, lesson, eval case, preference pair):

`organizational → domain(pneumonia) → service_line(pulmonary) → patient`

Evals and exports are computed and reported **per layer**, so alignment and lessons roll up the chain.

## 5. Abstraction (module layers, dependency flows downward)

| Module | New? | Single purpose |
|---|---|---|
| `schemas.py` | extend | Domain types + new collection/eval/export types. |
| `factory.py` · `runtime.py` · `whatif.py` | unchanged | Generative engine → scored handoff + trace. |
| `memory.py` | extend | Persist tools (today) + sessions, annotations, lessons, eval-labeled traces, all chain-tagged. |
| `datalake.py` | **new** | Mock data lake: `outcome_for(case_id) -> Outcome`. Swappable for a real lake. |
| `session.py` | **new** | Case-conference engine: hold active case, collect tally judgments + notes, reconcile with lake, record consensus + reusable rule (benevolent-dictator gate). |
| `evals.py` | **new** | Hamel-grade: open codes → axial taxonomy; binary eval cases; judge alignment (TPR/TNR: tool vs room vs outcome) per layer. |
| `export.py` | **new** | Standard artifacts: eval suite (JSONL), RLHF preference pairs (prompt/chosen/rejected), case-study doc. |
| `proof.py` | extend | Existing HOMER-1 criteria + new chain criteria. |
| `web.py` + `web/` | extend | Session/eval/export endpoints (Bonsai proxies stay); UI shifts to the 5-step conference. |

No cycles. Data flow: PatientCase → engine → session presents → room annotates → datalake reconciles → leader decides+rule → memory persists (tagged) → evals compute → export → proof verifies → web delivers.

## 6. Data model (new types in `schemas.py`)

- `KnowledgeLayer(Enum)`: organizational, domain, service_line, patient.
- `Outcome`: patient_id, readmitted_30d: bool, days_to_readmit: int|None, length_of_stay: int, followup_kept: bool, source="mock_data_lake".
- `Judgment`: step: Literal["analyze","simulate","output"], pass_votes: int, fail_votes: int, note: str; derived `consensus` = "pass" if pass_votes >= fail_votes else "fail" (leader may override).
- `Lesson`: text, knowledge_layer, source_case_id, author_role="service_line_leader", created_at.
- `EvalCase`: id, source_case_id, step, prompt (trace-step + handoff context), expected: Literal["pass","fail"] (= room consensus), knowledge_layer, rationale.
- `PreferencePair`: prompt, chosen, rejected, knowledge_layer, source_case_id. (DPO-ready.)
- `JudgeAlignment`: knowledge_layer, n, tpr, tnr, room_vs_outcome_agreement, tool_vs_outcome_agreement.
- `CaseStudy`: source_case_id, hero_image_seed, vignette, scenario_narrations: list[str], verdict_summary, outcome, lesson, knowledge_layer.
- `Session`: id, case_ids, active_case_id, judgments: list[Judgment], lessons: list[Lesson], facilitator, status, started_at.

## 7. Finite-state machine (UI)

States S0–S8 with a compounding loop. Persistent chrome on every state (stepper · case id · knowledge-layer tag · memory/acceleration readout) satisfies the trunk test. Back is always available and non-destructive.

| State | Frontstage | Primary action → next |
|---|---|---|
| S0 LOBBY | Pick case/agenda; warm memory + acceleration. | Begin session → S1 |
| S1 CONVENE | "This room established N rules; toolset is warm." | Present case → S2 |
| S2 PRESENT | Scored handoff + trace; bands; red flags; "requires human review." | See what-ifs → S3 |
| S3 FEEL | 3 Bonsai-illustrated discharge paths + narration (hero). | Open the vote → S4 |
| S4 JUDGE | Tally pass/fail for **analyze / simulate / output** + one-line why; live split. Small what-if anchor pinned. | Lock consensus → S5 |
| S5 RECKON | Mock outcome revealed; room-vs-truth + tool-vs-truth; what-if callback frame. | Decide → S6 |
| S6 DECIDE | Leader records disposition + one reusable rule; tags knowledge layer. | Compound & export → S7 |
| S7 COMPOUND | Payoff: memory +1 lesson, eval +1 case, RLHF +1 pair, acceleration ticks. | Next case ↺ → S2 · or End → S8 |
| S8 SUMMARY | Lessons, eval-suite size, alignment TPR/TNR, download bundle. | Close |

**S7 → S2 is the compounding loop:** each next case starts warmer (Factory reuses tools; prior lessons in context).

## 8. Screens & the what-if spine

- **Locked decisions:** vote is **facilitator-entered tallies** (pass/fail counts + consensus chip), not per-device polling; judging covers the **3 clinically-weighted steps** (analyze/simulate/output), not all 5.
- **What-if does four jobs from one aesthetic:** hero (S3) → anchor (S4, small pinned frame) → callback (S5, the path the data confirms) → artifact spine (S7 case study hero image).
- **Visual-consistency mechanics:** seed-locked per case (stable hero across screens + export); one prompt scaffold carrying shared dignity guardrails (no identifiable likeness, no fear, no gore); one frame language (16:9, Δ-readmission chip, source chip); canvas fallback reuses the same palette so offline still looks intentional.
- **Prose registers (Bonsai Writer, fixed templates):** (1) vignette — plain-language patient story; (2) scenario-day narrations ×3 — the empathy; (3) lesson — the reusable rule in prose. These + the hero frame compose the `CaseStudy` artifact, which is simultaneously the institutional-memory entry, a shareable teaching case, and the human-readable face of the export.

## 9. Evaluation methodology (Hamel mapping)

- **Binary, not Likert** — every judgment is pass/fail; "gradual progress" is sub-component binaries.
- **Error analysis is the session** — notes are open codes; `evals.py` axial-codes them into a failure taxonomy with per-category frequency, tagged by knowledge layer.
- **Human label = room consensus** (benevolent dictator: the leader can override the tally). This is the eval's ground truth.
- **Judge alignment** — compute TPR/TNR of the runtime/tool against room consensus on a held-out split; separately track room-vs-outcome and tool-vs-outcome agreement (the data-lake reality check). Report per layer.
- **Don't fake pass rates** — surface disagreement and low alignment honestly; a 100% pass session means the cases were too easy.

## 10. Export formats (the value-add output)

- **Eval suite** — JSONL of `EvalCase` (one row per judged step), binary `expected`, `knowledge_layer`, rationale. Consumable as a regression eval for any model.
- **RLHF preference data** — JSONL of `PreferencePair` (`prompt`, `chosen`, `rejected`, `knowledge_layer`), DPO-ready. A pair is emitted **wherever the room consensus overturns the tool** on a judged step (or the leader records a rule that contradicts the tool's handoff): `chosen` = the room/leader-preferred call + rationale, `rejected` = the tool's original call. Steps where room and tool agree produce eval cases but no preference pair (no signal to learn from).
- **Case study** — Markdown (+ hero PNG reference) per `CaseStudy`. Human-readable teaching artifact.
- **Bundle** — S8 "download bundle" zips eval.jsonl + preferences.jsonl + case studies + an alignment report.

## 11. Data lake (mock)

`datalake.py` returns deterministic `Outcome`s for the synthetic cohort (e.g., pna-001 readmitted day 9; pna-002 not readmitted; pna-003 readmitted day 14). Single interface `outcome_for(case_id) -> Outcome`; clearly labeled mock; documented as the swap point for a real lake. No PHI.

## 12. Scope / non-goals (YAGNI)

In: single facilitator, synthetic cohort, tally voting, mock data lake, eval + preference + case-study export, the 9-state UI, per-layer alignment. **Out:** real auth/multi-tenant, per-device live polling, real data-lake connectors, actual model training (we export DPO-ready data; we do not train), real PHI handling, mobile-native.

## 13. Testing

- Unit: datalake determinism; judgment→consensus; eval-case construction; preference-pair well-formedness; alignment math (TPR/TNR on a known confusion matrix); case-study assembly.
- Integration: a scripted session (present→judge→reckon→decide→compound) produces a non-empty eval suite, ≥1 preference pair, a persisted lesson, and a chain-tagged memory entry.
- Proof: extend `proof.py` with cohort criteria — annotations yield evals; alignment computed; exports well-formed; differentiated routing still holds; acceleration still compounds.
- Offline: UI + server work with Bonsai down (canvas + fallback prose).

## 14. Build order

1. `schemas.py` additions. 2. `datalake.py` + tests. 3. `session.py` + tests. 4. `evals.py` + tests. 5. `export.py` + tests. 6. `memory.py` extensions (persist sessions/lessons/evals, chain-tagged). 7. `proof.py` new criteria. 8. `web.py` endpoints (`/api/session*`, `/api/datalake`, `/api/evals`, `/api/export`). 9. `web/` UI FSM (S0–S8) honoring the Krug contract + what-if spine. 10. Docs + README + commit/PR.

## 15. Safety & governance

Synthetic data only; "Do not store PHI" retained on every persisted event. SDOH features may only *add* support, never ration it; no protected-class inference (per Obermeyer 2019, see `docs/RESEARCH.md`). AI output is an upgrade, never authoritative; a human always makes the call. Mock data lake and generated artifacts are clearly labeled non-clinical.
