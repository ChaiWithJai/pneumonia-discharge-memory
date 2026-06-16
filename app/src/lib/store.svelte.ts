import { api } from "./api";
import type { Config, FinalizeResponse, JudgmentInput, MemoryState, Outcome, PresentResponse } from "./types";

export type State =
  | "lobby"
  | "convene"
  | "present"
  | "feel"
  | "judge"
  | "reckon"
  | "decide"
  | "compound"
  | "summary";

export const FLOW: State[] = ["present", "feel", "judge", "reckon", "decide", "compound"];

export const EMOTION: Record<State, string> = {
  lobby: "curiosity",
  convene: "curiosity",
  present: "curiosity",
  feel: "empathy",
  judge: "tension",
  reckon: "humility",
  decide: "alignment",
  compound: "pride",
  summary: "pride",
};

const COHORT = [
  "pneumonia_case_001.json",
  "pneumonia_case_003_missing_data.json",
  "pneumonia_case_002_low_risk.json",
];

function freshJudgments(): JudgmentInput[] {
  return [
    { step: "analyze", pass_votes: 0, fail_votes: 0, note: "" },
    { step: "simulate", pass_votes: 0, fail_votes: 0, note: "" },
    { step: "output", pass_votes: 0, fail_votes: 0, note: "" },
  ];
}

class Conference {
  state = $state<State>("lobby");
  config = $state<Config | null>(null);
  memory = $state<MemoryState | null>(null);

  cohortIndex = $state(0);
  caseFile = $state(COHORT[0]);
  present = $state<PresentResponse | null>(null);
  outcome = $state<Outcome | null>(null);
  judgments = $state<JudgmentInput[]>(freshJudgments());
  lessonText = $state("");
  layer = $state("service_line");

  finalized = $state<FinalizeResponse | null>(null);
  casesDone = $state(0);
  busy = $state(false);
  error = $state("");

  async boot() {
    try {
      this.config = await api.config();
    } catch {
      this.error = "Server unreachable — start with `pdm-web`.";
    }
    await this.refreshMemory();
  }

  async refreshMemory() {
    try {
      this.memory = await api.memory();
    } catch {
      /* ignore */
    }
  }

  goto(s: State) {
    this.state = s;
  }

  begin() {
    this.goto("convene");
  }

  async presentCase() {
    this.busy = true;
    this.error = "";
    try {
      this.present = await api.present(this.caseFile);
      this.outcome = null;
      this.judgments = freshJudgments();
      this.lessonText = "";
      await this.refreshMemory();
      this.goto("present");
    } catch (e) {
      this.error = String(e);
    }
    this.busy = false;
  }

  toFeel() {
    this.goto("feel");
  }
  toJudge() {
    this.goto("judge");
  }

  async lockVote() {
    if (!this.present) return;
    this.busy = true;
    try {
      this.outcome = await api.outcome(this.present.runtime.patient_id);
      this.goto("reckon");
    } catch (e) {
      this.error = String(e);
    }
    this.busy = false;
  }

  toDecide() {
    this.goto("decide");
  }

  async compound() {
    if (!this.present) return;
    this.busy = true;
    try {
      this.finalized = await api.finalize({
        case: this.caseFile,
        judgments: this.judgments,
        lesson: this.lessonText.trim() ? { text: this.lessonText.trim(), knowledge_layer: this.layer } : null,
        knowledge_layer: this.layer,
      });
      this.memory = this.finalized.memory;
      this.casesDone += 1;
      this.goto("compound");
    } catch (e) {
      this.error = String(e);
    }
    this.busy = false;
  }

  hasNextCase(): boolean {
    return this.cohortIndex + 1 < COHORT.length;
  }

  async nextCase() {
    if (!this.hasNextCase()) return this.goto("summary");
    this.cohortIndex += 1;
    this.caseFile = COHORT[this.cohortIndex];
    await this.presentCase();
  }

  end() {
    this.goto("summary");
  }

  restart() {
    this.cohortIndex = 0;
    this.caseFile = COHORT[0];
    this.casesDone = 0;
    this.finalized = null;
    this.present = null;
    this.goto("lobby");
  }
}

export const conf = new Conference();
