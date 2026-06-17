# EMBER — Loop Engineering

### From the framework to a prototype we can use today, then 1–2 vetted customers this week

-----

## 1. What loop engineering is (the 60-second version)

The June-2026 successor to prompt/context engineering. The shift, in Boris Cherny’s words (creator of Claude Code): *you stop prompting the agent and start designing the loops that prompt it.* swyx’s framing is **“loopcraft — the art of stacking loops”:** an agent isn’t one loop, it’s a stack of them, and the leverage is in how you stack and instrument each level. Lineage: **ReAct → Ralph → /loop.**

For us, the punchline is that Ember’s “intelligence” — the companion’s voice, the reflection, the world-state — is not a prompt. It’s a stack of loops we engineer, grade, and improve.

## 2. Who to listen to, and on what

|Voice                                         |Listen to them on                                                                     |Source                                      |
|----------------------------------------------|--------------------------------------------------------------------------------------|--------------------------------------------|
|**swyx** (Latent Space, “AI Engineer”)        |the canonical mental model — *loopcraft / stacking loops*                             |“loopcraft: the art of stacking loops”      |
|**Boris Cherny** (Anthropic, Claude Code)     |the posture shift; effective harnesses for long-running agents                        |his “loops prompt the agent, not me”        |
|**Peter Steinberger** (@steipete, now OpenAI) |designing loops that prompt agents; heartbeats (openclaw)                             |the 6.5M-view post                          |
|**Addy Osmani** (Google)                      |the synthesized practitioner guide + reference repo                                   |popularized the term                        |
|**Andrej Karpathy**                           |why the value is in the loop, not the model                                           |his talk                                    |
|**Harrison Chase / Sydney Runkle** (LangChain)|the **formal four-loop model** + primitives                                           |“The Art of Loop Engineering” (Jun 16, 2026)|
|**Hamel Husain**                              |the discipline that makes loops 2 & 4 real: *look at your data*, error analysis, evals|his evals work                              |

## 3. LangChain’s model (yes, they built one — one day ago)

LangChain’s four stacked loops, each mapped to a primitive, with **human-in-the-loop first-class at every level**:

|Loop                |What it does                                                 |Impact                     |LangChain primitive              |
|--------------------|-------------------------------------------------------------|---------------------------|---------------------------------|
|**1. Agent**        |model calls tools until the task is done                     |automate work              |`create_agent`                   |
|**2. Verification** |output scored vs. a rubric, retried with feedback if it fails|quality & correctness      |`RubricMiddleware` / LLM-as-judge|
|**3. Event-driven** |events/cron/webhooks trigger runs that update a real system  |work at scale, ambient     |cron / webhooks / Fleet channels |
|**4. Hill-climbing**|traces feed an analysis agent that rewrites the harness      |the harness improves itself|LangSmith Engine                 |

The key move: loop 4’s return arrow doesn’t just loop to the top — *it reaches inside and updates the inner loops.* Each cycle makes the agent better. Human oversight points: approve sensitive actions (L1), act as grader (L2), approve user-facing output (L3), approve harness changes (L4).

-----

## 4. Ember’s loops (the model, instantiated)

Ember’s intelligence lives in four loops, named in our lexicon:

### Loop 1 — **The Companion Engine** (agent loop)

A thin agent that *is* the Ember. Context in → in-character response / world-update / reflection out.

- **Tools:** `getState()` (from the Witness — HRV, sleep, movement, or mocked), `getHistory()` (the Ledger), `getPracticeContext()`, `updateWorld()` (the Loom).
- **Output:** the companion’s voice, what lit/dimmed, the dream-harvest reflection.

### Loop 2 — **The Grader** (verification loop) — *the most important loop we own*

Every Companion Engine output is scored against the **Facilitator Rubric** before it ever reaches a human:

- in-voice and warm; **no guilt, shaming, or streak-debt language**; no medical claims; honors the Hush-not-punishment rule.
- **The safety gate (non-negotiable):** if signals/words suggest genuine crisis, the output must route to the **care path** (real human/crisis resources), never gamified comfort. This is a hard, deterministic rule, not a soft judge.
- Mechanism: deterministic checks + LLM-as-judge. **During the pilot, a human is the grader** (every output reviewed before it reaches a customer).

### Loop 3 — **The Heartbeat** (event-driven loop)

What makes Ember ambient. Triggers fire the Companion Engine: a sensed event (coherence detected, a lapse, morning), a schedule (the overnight dream-harvest, the daily reflection). *Indistractable guardrail:* heartbeats update the **world**, they do not spam notifications. (We don’t ship L3 for the prototype — see §5 — but the design assumes it.)

### Loop 4 — **The Studio** (hill-climbing loop)

Every interaction logs a trace (state in → output → grade → the customer’s reaction). Daily, we read every trace (Hamel’s “look at your data”), run error analysis, and rewrite the rubric and prompts. With only 1–2 customers, we can read *100%* of traces — the highest-signal phase the product will ever have.

-----

## 5. The build plan

### TODAY — internal Wizard-of-Oz (Loops 1 + 2, humans fully in)

Goal: the internal team can “talk to the Ember” by end of day.

1. **Loop 1, thinnest version:** `create_agent` (LangChain) or a 60-line custom harness — context in, companion voice out. Model: **Claude** (the care/safety profile matters here).
1. **Mock the Witness:** no camera PPG, no HealthKit. The operator *types the state* — “HRV low, slept 5h, hasn’t moved, hasn’t messaged anyone in 3 days.” The Ember responds. This tests the soul without any sensing build.
1. **Loop 2, human grader:** the team reviews every output against a first draft of the Facilitator Rubric. Wrong-toned outputs become the first eval cases.
1. **Run the two make-or-break scenes from the journey:** the **first breath (A6)** and the **return-after-a-lapse (D2)**. If the Wizard-of-Oz return feels like relief, not debt, proceed.

### THIS WEEK — 1–2 vetted customers (add thin real input + traces)

Goal: two consenting, psychologically-safe, known-to-us people live with it for a week.

1. **Thin real Witness:** the cheapest real signal — a daily Apple Health pull *or* a 20-second manual check-in. Not camera PPG yet. The **Loom is source-agnostic**, so this swaps later.
1. **Human-in-the-loop stays on:** the team reviews/approves Ember’s daily output before (or same-day as) it reaches the customer. This is the safety net *and* the eval engine.
1. **Instrument every trace:** LangSmith, or just structured logs. We will read all of them.
1. **The care path is live from day one** — even in a 2-person pilot, crisis escalation must work. This is a launch gate, not a later feature.

### EVERY DAY — the Studio (Loop 4)

Read 100% of traces → error analysis → update the Facilitator Rubric and the Companion Engine prompt → redeploy. The rubric *is* our growing eval set. This is the loop where Ember’s voice actually becomes good.

### The maturity ladder

Start with humans heavily in the loop (Wizard-of-Oz → human grader → human approval), and **remove humans only as the rubric earns trust** — and **never** for the safety gate. We graduate Loop 2 from “human grades everything” → “LLM-judge grades, human spot-checks” → “LLM-judge with human only on flagged outputs.” Loop 3 (the Heartbeat) and full automation come only after the voice is proven.

-----

## 6. Non-negotiables for a pilot with real people

1. **Safety/care path live** before the first customer touches it — designed with professional input.
1. **Human in the loop** the entire pilot; no unreviewed output reaches a vetted customer.
1. **Informed consent + data dignity** — they know what’s sensed; the Ledger lets them export/delete.
1. **The Facilitator Rubric is enforced in code**, not vibes — guilt/streak/scarcity language fails the grader.
1. **Heartbeats update the world, never spam** — Indistractable from the first build.

## 7. Recommended stack (so we move today)

- **Loop 1:** LangChain `create_agent` / LangGraph for control, on **Claude**. (Custom thin harness is fine too — the loop matters more than the framework.)
- **Loop 2:** `RubricMiddleware` / LLM-as-judge for the Facilitator Rubric + deterministic safety rules + human grader during pilot.
- **Loop 4:** LangSmith traces + Engine for trace analysis — or read them by hand (with 2 customers, by hand is fine and higher-signal).
- **Loop 3:** deferred until post-pilot.

-----

## OPEN DECISIONS

1. **Build vs. buy the harness** — LangChain/LangGraph (fast, instrumented, HITL primitives) vs. a thin custom loop (full control, fewer deps). For *today*, LangChain gets us there faster.
1. **First real signal** — Apple Health pull vs. 20-second manual check-in for the week-one pilot. Manual is faster to ship and arguably more honest as a test of the *voice*.
1. **Who are the 1–2 customers** — they must be vetted for psychological safety and genuine consent; ideally people you know well enough to debrief candidly every day.
1. **Care-path partner** — who do we bring in to stand up crisis escalation responsibly before customer one?