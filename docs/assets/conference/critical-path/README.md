# Critical-path walkthrough

A full, in-order capture of the case-conference critical path — all nine states from a cold start
(fresh institutional memory) through to the exported session bundle. Captured by driving the built
Svelte app (`app/dist`) served by `pdm-web`, with both Bonsai endpoints **offline**, so every frame
shows the deterministic, offline-first fallback the README promises (clinical-canvas what-ifs,
clinical-text narration). The curated hero images one directory up were captured with the Bonsai
image studio running and show real on-device diffusion renders; these are intentionally kept
separate and are not a replacement for them.

| # | State | File |
|---|-------|------|
| 0 | **Lobby** — cold open | [`s0-lobby.png`](s0-lobby.png) |
| 1 | **Convene** — fresh service line | [`s1-convene.png`](s1-convene.png) |
| 2 | **Present** — the scored handoff | [`s2-present.png`](s2-present.png) |
| 3 | **Feel** — three illustrated what-ifs | [`s3-feel.png`](s3-feel.png) |
| 4 | **Judge** — binary verdict per step | [`s4-judge.png`](s4-judge.png) |
| 5 | **Reckon** — the data-lake reveal | [`s5-reckon.png`](s5-reckon.png) |
| 6 | **Decide** — record one reusable rule | [`s6-decide.png`](s6-decide.png) |
| 7 | **Compound** — the payoff | [`s7-compound.png`](s7-compound.png) |
| 8 | **Summary** — the export bundle | [`s8-summary.png`](s8-summary.png) |

## Reproduce

```bash
# 1) serve the built app with fresh memory (Bonsai may be up or down — fallbacks are deterministic)
pdm-web                                   # http://127.0.0.1:8765

# 2) drive the critical path and write screenshots (needs Playwright + a Chromium build)
cd app && OUT=/tmp/shots node shots.mjs
```

`app/shots.mjs` walks lobby → convene → present → feel → judge (votes all three steps) → reckon →
decide (records a rule) → compound → summary, screenshotting each state full-page.
