// The composition root + app state machine. Wires the pure engine, the loops
// (Companion Engine → care gate → Grader → Studio), the sources, and the
// Ledger. Screens read this store and call its actions; the router renders
// whatever `screen` is current.

import {
  assembleTriad,
  freshCircle,
  freshCountry,
  freshWoken,
  ingest,
  overnightPass,
  summarize,
  tick,
  witness,
} from "./engine";
import type {
  DailySummary,
  Dimension,
  Ember,
  EmberSave,
  NourishmentScore,
  Settings,
  TemperamentId,
  WokenId,
} from "./types";
import { respond } from "./loops/companion";
import { decideHeartbeat } from "./loops/heartbeat";
import type { CompanionEvent } from "./loops/voice";
import type { Trace } from "./loops/studio";
import { CARE_RESOURCES } from "./loops/carepath";
import type { CareResource } from "./loops/carepath";
import { SimulatedSource } from "./sources/SimulatedSource";
import { practiceSummary, manualSummary } from "./sources/manual";
import { LocalStorageStore } from "./store/LocalStorageStore";
import type { PassiveSource } from "./sources/SignalSource";

const DAY = 86_400_000;

export type Screen =
  | "A1" | "A2" | "A3" | "A4" | "A5" | "A6"
  | "B1" | "B2" | "B3" | "B4" | "B5"
  | "C1" | "C2" | "C3" | "C4"
  | "D2" | "D3"
  | "E1" | "E2" | "E3"
  | "F1" | "F2" | "F3" | "F4"
  | "checkin" | "carepath" | "studio";

export interface Utterance {
  kind: "voice" | "care";
  text: string;
}

function defaultSettings(): Settings {
  return {
    sensing: { breath: true, rest: true, movement: true, attention: true, connection: false },
    nudgesEnabled: false,
  };
}

class EmberApp {
  // persisted model + UI state
  save = $state<EmberSave | null>(null);
  screen = $state<Screen>("A1");
  utterance = $state<Utterance | null>(null);
  busy = $state(false);

  // transient
  justWoke = $state<WokenId[]>([]);
  lapseDays = $state(0);
  harvest = $state<string | undefined>(undefined);
  careResources = $state<CareResource[]>(CARE_RESOURCES);

  // onboarding drafts
  draftTemperament = $state<TemperamentId>("root");
  draftName = $state("");

  // selected Woken for the companion-detail screen (C2)
  selectedWoken = $state<WokenId | null>(null);

  // dev: time travel so the Hush/Return is demonstrable without waiting days
  clockOffsetMs = $state(0);

  // Loop 2 — human-in-the-loop. When on, new utterances are marked pending for
  // an operator to review (the pilot discipline). Off = the rubric earns trust.
  reviewMode = $state(false);

  private store = new LocalStorageStore();
  private source: PassiveSource = new SimulatedSource(7);
  private traces: Trace[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  now(): number {
    return Date.now() + this.clockOffsetMs;
  }

  // ---- derived views ----
  get ember(): Ember | null {
    return this.save?.ember ?? null;
  }
  get nourishment(): NourishmentScore {
    return summarize(this.save?.summaries ?? [], this.now());
  }
  get inHush(): boolean {
    return (this.save?.country.hush ?? 0) > 0.45;
  }
  get traceCount(): number {
    return this.traces.length;
  }
  allTraces(): Trace[] {
    return this.traces;
  }

  // ---- boot / persistence ----
  boot(): void {
    this.traces = this.store.loadTraces();
    const loaded = this.store.load();
    if (!loaded) {
      this.screen = "A1";
      return;
    }
    this.save = loaded;
    const lapsed = this.applyHeartbeat(this.now());
    if (lapsed) {
      this.speak("return");
      this.screen = "D2";
    } else {
      this.speak("daily");
      this.screen = "B1";
    }
  }

  /**
   * LOOP 3 — apply the Heartbeat: due overnight passes + the tick (the Hush),
   * committed. Updates the WORLD only; it never navigates or notifies on its own
   * (Indistractable). Returns whether re-entry should be the Return.
   */
  private applyHeartbeat(now: number): boolean {
    if (!this.save) return false;
    const d = decideHeartbeat(this.save.country, now);
    this.lapseDays = d.lapseDays;
    let country = { ...this.save.country };
    let harvest: string | undefined;
    for (let i = 0; i < d.overnightDays; i++) {
      const r = overnightPass(country, this.save.woken.hearthkeeper.awake, now);
      country = r.country;
      if (r.harvest) harvest = r.harvest;
    }
    country = tick(country, now);
    this.commit({ ...this.save, country });
    this.harvest = harvest;
    return d.lapsed;
  }

  /** A gentle in-session pulse: keeps the world current. Never forces a screen. */
  pulse(): void {
    if (this.save) this.applyHeartbeat(this.now());
  }
  startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => this.pulse(), 60_000);
  }
  stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private commit(next: EmberSave): void {
    this.save = next;
    this.store.save(next);
  }

  // ---- onboarding ----
  go(screen: Screen): void {
    this.screen = screen;
  }
  chooseTemperament(id: TemperamentId): void {
    this.draftTemperament = id;
    this.go("A4");
  }
  nameEmber(name: string): void {
    this.draftName = name.trim();
    this.go("A5");
  }
  connectWitness(sensing: Settings["sensing"]): void {
    // record the trust-gate choices; the device "connects" at first breath.
    const s = { ...defaultSettings(), sensing };
    this.pendingSettings = s;
    this.go("A6");
  }
  private pendingSettings: Settings = defaultSettings();

  /** A6: the aha. The first sensed breath lights the first valley; the ember catches. */
  completeFirstBreath(): void {
    const now = this.now();
    const ember: Ember = {
      id: `e_${now.toString(36)}`,
      name: this.draftName || "Cinder",
      temperament: this.draftTemperament,
      seed: Math.floor(now % 100000),
      bornAt: now,
    };
    const save: EmberSave = {
      version: 1,
      ember,
      country: freshCountry(now),
      woken: freshWoken(),
      circle: freshCircle(),
      dex: [],
      summaries: [],
      settings: this.pendingSettings,
    };
    this.save = save;
    // the breath itself
    this.applySummary(practiceSummary("breath", now), { silent: true });
    // the connected device has already been watching this week — backfill so the
    // country reflects recent living (still mostly dim; the breath valley leads).
    if (save.settings.sensing.rest || save.settings.sensing.movement) {
      for (const s of this.source.history(6, now)) this.applySummary(s, { silent: true });
    }
    this.speak("first-breath");
    this.go("B1");
  }

  // ---- the daily loop ----
  /** Ingest a normalized summary through the Loom + the Circle (no speaking). */
  private applySummary(summary: DailySummary, opts: { silent?: boolean } = {}): void {
    if (!this.save) return;
    const before = this.save.country.lifetimeLight;
    const country = ingest(this.save.country, summary, summary.at);
    const w = witness(this.save.woken, summary, summary.at);
    const circle = assembleTriad(w.woken);
    const dex = [
      ...this.save.dex,
      {
        day: summary.day,
        source: summary.source,
        values: summary.values,
        lightDelta: country.lifetimeLight - before,
      },
    ];
    this.commit({
      ...this.save,
      country,
      woken: w.woken,
      circle,
      dex,
      summaries: [...this.save.summaries, summary].slice(-120),
    });
    this.justWoke = w.justWoke;
    if (!opts.silent && w.justWoke.length) this.go("C3");
  }

  /** Manual / CLI-style input (ADR-0002). */
  ingestManual(values: Partial<Record<Dimension, number>>): void {
    this.applySummary(manualSummary(values, this.now()));
    this.speak("witness");
  }

  /** Dev/demo: live one simulated day from the worn device. */
  simulateDay(): void {
    this.applySummary(this.source.today(this.now()));
    this.speak("witness");
  }

  /** A practice from the Kindling library — fuel that wakes the Woken. */
  tend(dimension: Dimension): void {
    const justWokeBefore = this.justWoke.length;
    this.applySummary(practiceSummary(dimension, this.now()));
    if (this.justWoke.length > justWokeBefore || this.screen === "C3") return; // C3 ceremony
    this.speak("witness");
    this.go("B5");
  }

  kindle(): void {
    this.speak("kindle");
    this.go("B5");
  }

  openWoken(id: WokenId): void {
    this.selectedWoken = id;
    this.go("C2");
  }

  storm(): void {
    this.speak("storm");
    this.go("D3");
  }

  // ---- the loop: Companion Engine → care gate → Grader → Studio ----
  speak(event: CompanionEvent, careText?: string): void {
    if (!this.save) return;
    const u = respond(
      {
        event,
        temperament: this.save.ember.temperament,
        emberName: this.save.ember.name,
        country: this.save.country,
        nourishment: this.nourishment,
        justWoke: this.justWoke,
        lapseDays: this.lapseDays,
        harvest: this.harvest,
      },
      { careSignal: careText ? { text: careText } : undefined },
    );
    this.utterance = { kind: u.kind, text: u.text };
    const trace = { ...u.trace, reviewed: !this.reviewMode };
    this.traces = [...this.traces, trace].slice(-500);
    this.store.saveTraces(this.traces);
    if (u.kind === "care") {
      this.careResources = CARE_RESOURCES;
      this.go("carepath");
    }
  }

  /** A free-text check-in passes through the care gate first (loop plan §4). */
  checkIn(text: string): void {
    this.speak("daily", text);
  }

  // ---- dev time travel (System screen) ----
  advanceDays(days: number): void {
    this.clockOffsetMs += days * DAY;
    const lapsed = this.applyHeartbeat(this.now());
    if (lapsed) {
      this.speak("return");
      this.go("D2");
    }
  }

  // ---- settings (the Ledger / Triggers / You) ----
  setSensing(d: Dimension, on: boolean): void {
    if (!this.save) return;
    this.commit({
      ...this.save,
      settings: { ...this.save.settings, sensing: { ...this.save.settings.sensing, [d]: on } },
    });
  }
  setNudges(on: boolean): void {
    if (!this.save) return;
    this.commit({ ...this.save, settings: { ...this.save.settings, nudgesEnabled: on } });
  }
  setTemperament(id: TemperamentId): void {
    if (!this.save) return;
    this.commit({ ...this.save, ember: { ...this.save.ember, temperament: id } });
  }

  // ---- Loop 2/4 — operator review + the growing eval set ----
  setReviewMode(on: boolean): void {
    this.reviewMode = on;
  }
  labelTrace(id: string, label: "good" | "bad"): void {
    this.traces = this.traces.map((t) =>
      t.id === id ? { ...t, label, reviewed: true } : t,
    );
    this.store.saveTraces(this.traces);
  }
  clearPending(): void {
    this.traces = this.traces.map((t) =>
      t.reviewed === false ? { ...t, reviewed: true } : t,
    );
    this.store.saveTraces(this.traces);
  }

  // ---- the Ledger ----
  exportJSON(): string {
    return this.store.exportJSON();
  }
  wipe(): void {
    this.store.wipe();
    this.save = null;
    this.traces = [];
    this.clockOffsetMs = 0;
    this.go("A1");
  }
}

export const ember = new EmberApp();
