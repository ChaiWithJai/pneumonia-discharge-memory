// API shapes (subset used by the UI) mirroring the Python pydantic models.

export type Band = "low" | "moderate" | "high";
export type JudgedStep = "analyze" | "simulate" | "output";
export type Verdict = "pass" | "fail";

export interface EvidenceItem {
  key: string;
  value: unknown;
  source: string;
  interpretation: string;
}
export interface Score {
  name: string;
  value: number;
  band: Band;
  evidence: EvidenceItem[];
}
export interface TraceStep {
  state: string;
  action: string;
  inputs: string[];
  outputs: string[];
  checks: string[];
}
export interface Scenario {
  name: string;
  assumption: string;
  readmission_risk_delta: number;
  empathy_prompt: string;
  operational_trigger: string;
}
export interface Handoff {
  disposition: string;
  summary: string;
  required_human_review: boolean;
  actions_to_consider: string[];
  red_flags: string[];
  clinician_note: string;
}
export interface FactoryReport {
  run_index: number;
  tools_generated: string[];
  tools_reused: string[];
  engineering_steps_saved: number;
}
export interface RuntimeResult {
  patient_id: string;
  run_index: number;
  instruments: { name: string; version: string }[];
  factory_report: FactoryReport;
  trace: TraceStep[];
  scores: Score[];
  analyze_iterations: number;
  scenarios: Scenario[];
  handoff: Handoff;
}
export interface PresentResponse {
  runtime: RuntimeResult;
  hero_seed: number;
  vignette: string;
}
export interface Outcome {
  patient_id: string;
  readmitted_30d: boolean;
  days_to_readmit: number | null;
  length_of_stay_days: number;
  followup_kept: boolean;
}
export interface JudgmentInput {
  step: JudgedStep;
  pass_votes: number;
  fail_votes: number;
  note: string;
}
export interface Alignment {
  knowledge_layer: string;
  n: number;
  tpr: number;
  tnr: number;
  room_vs_outcome_agreement: number;
  tool_vs_outcome_agreement: number;
}
export interface FinalizeResponse {
  case_study: {
    source_case_id: string;
    hero_image_seed: number;
    vignette: string;
    scenario_narrations: string[];
    verdict_summary: string;
    lesson: { text: string; knowledge_layer: string } | null;
  };
  outcome: Outcome;
  taxonomy: { category: string; count: number; examples: string[] }[];
  counts: { eval_cases: number; preference_pairs: number; case_studies: number; lessons: number };
  alignment: Alignment[];
  memory: MemoryState;
}
export interface MemoryState {
  tools_in_memory: number;
  runs_completed: number;
  cumulative_steps_saved: number;
  tools: string[];
  timeline: { type: string; name: string | null; run_index: number | null }[];
}
export interface Config {
  writer_available: boolean;
  studio_available: boolean;
  cases: string[];
}
export interface Bundle {
  eval_suite_jsonl: string;
  preferences_jsonl: string;
  case_studies_markdown: string;
  alignment: Alignment[];
  counts: { eval_cases: number; preference_pairs: number; case_studies: number; lessons: number };
}
