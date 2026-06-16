from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field


class RuntimeState(str, Enum):
    FACTORY = "factory"
    PLAN = "plan"
    ANALYZE = "analyze"
    SIMULATE = "simulate"
    OUTPUT = "output"
    PERSIST = "persist"


class VitalTrend(BaseModel):
    afebrile_hours: int = Field(ge=0)
    oxygen_saturation_room_air: float = Field(ge=0, le=100)
    respiratory_rate: int = Field(ge=0)
    heart_rate: int = Field(ge=0)
    systolic_bp: int = Field(ge=0)


class LabTrend(BaseModel):
    wbc_current: float = Field(ge=0)
    wbc_48h_delta: float
    procalcitonin_trend: Literal["falling", "flat", "rising", "unknown"] = "unknown"
    cultures_pending: bool = False


class MedicationContext(BaseModel):
    antibiotics_ordered: bool
    oral_stepdown_ready: bool
    med_access_risk: Literal["low", "moderate", "high"]
    adherence_concern: bool = False


class SocialContext(BaseModel):
    zip_code: str
    lives_alone: bool = False
    caregiver_available: bool = False
    health_literacy_risk: Literal["low", "moderate", "high"] = "moderate"
    pharmacy_access_minutes: int = Field(ge=0, default=20)
    home_health_eligible: bool = False


class MobilityContext(BaseModel):
    baseline_independent: bool
    current_mobility_drop: Literal["none", "mild", "moderate", "severe"]
    falls_last_6_months: int = Field(ge=0, default=0)
    nutrition_risk: Literal["low", "moderate", "high"] = "moderate"


class PatientCase(BaseModel):
    patient_id: str
    age: int = Field(ge=18)
    diagnosis: Literal["community_acquired_pneumonia", "pneumonia_other"]
    length_of_stay_days: int = Field(ge=0)
    prior_admissions_6_months: int = Field(ge=0)
    comorbidities: list[str] = Field(default_factory=list)
    vitals: VitalTrend
    labs: LabTrend
    meds: MedicationContext
    social: SocialContext
    mobility: MobilityContext
    notes: list[str] = Field(default_factory=list)


class Instrument(BaseModel):
    name: str
    version: str
    purpose: str
    inputs: list[str]
    validation_checks: list[str]
    limitations: list[str]


class EvidenceItem(BaseModel):
    key: str
    value: Any
    source: str
    interpretation: str


class Score(BaseModel):
    name: str
    value: float
    band: Literal["low", "moderate", "high"]
    evidence: list[EvidenceItem] = Field(default_factory=list)


class TraceStep(BaseModel):
    state: RuntimeState
    action: str
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    checks: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhatIfScenario(BaseModel):
    name: str
    assumption: str
    readmission_risk_delta: float
    empathy_prompt: str
    operational_trigger: str


class HandoffRecommendation(BaseModel):
    disposition: Literal["ready_with_supports", "delay_and_reassess", "clinician_review_required"]
    summary: str
    required_human_review: bool = True
    actions_to_consider: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    clinician_note: str


# --- Generative toolchain assembly (the HOMER-1 "Factory") ---------------------
#
# A ToolRule is a typed, code-generatable scoring primitive. The Factory turns a
# list of these into *executable Python source*, validates it, persists it to
# institutional memory, and reuses it on later runs. No free-form eval: every
# rule compiles to explicit, auditable arithmetic over pre-extracted inputs.


class ToolRule(BaseModel):
    input: str  # dotted path into PatientCase, e.g. "labs.wbc_current"
    kind: Literal["threshold", "flag", "map", "scaled"]
    op: Literal[">=", ">", "<=", "<", "=="] = ">="
    threshold: float | None = None
    weight: float = 0.0
    mapping: dict[str, float] | None = None
    cap: float | None = None  # optional ceiling on this rule's contribution
    interpretation: str = ""
    source_label: str = "synthetic case"
    surface_evidence: bool = False


class ToolSpec(BaseModel):
    name: str
    version: str
    purpose: str
    score_name: str
    inputs: list[str]
    rules: list[ToolRule]
    moderate_threshold: float = 0.34
    high_threshold: float = 0.67
    validation_checks: list[str]
    limitations: list[str]
    origin: Literal["deterministic_blueprint", "bonsai_proposed"] = "deterministic_blueprint"


class GeneratedTool(BaseModel):
    name: str
    version: str
    spec: ToolSpec
    source_code: str
    generated_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    run_index: int
    validation_passed: bool
    validation_report: list[str] = Field(default_factory=list)


class FactoryReport(BaseModel):
    run_index: int
    tools_generated: list[str] = Field(default_factory=list)
    tools_reused: list[str] = Field(default_factory=list)
    engineering_steps_this_run: int = 0
    engineering_steps_saved: int = 0
    cumulative_tools_in_memory: int = 0


class RuntimeResult(BaseModel):
    patient_id: str
    run_index: int
    instruments: list[Instrument]
    factory_report: FactoryReport
    trace: list[TraceStep]
    scores: list[Score]
    analyze_iterations: int = 1
    scenarios: list[WhatIfScenario]
    handoff: HandoffRecommendation
    institutional_memory_event: dict[str, Any]


# --- Institutional Knowledge Collector -----------------------------------------
#
# Types for the facilitated case-conference: the room judges the runtime's trace,
# the judgments reconcile against a mocked data lake, and everything compounds into
# institutional memory + exportable evals/preference data, tagged across a
# four-layer knowledge chain.


class KnowledgeLayer(str, Enum):
    ORGANIZATIONAL = "organizational"
    DOMAIN = "domain"
    SERVICE_LINE = "service_line"
    PATIENT = "patient"


JudgedStep = Literal["analyze", "simulate", "output"]


class Outcome(BaseModel):
    """A label from the (mocked) data lake — the bridge to the data team."""

    patient_id: str
    readmitted_30d: bool
    days_to_readmit: int | None = None
    length_of_stay_days: int = Field(ge=0)
    followup_kept: bool = False
    source: str = "mock_data_lake"


class Judgment(BaseModel):
    """The room's binary verdict on one trace step (facilitator-entered tally)."""

    step: JudgedStep
    pass_votes: int = Field(ge=0)
    fail_votes: int = Field(ge=0)
    note: str = ""
    leader_override: Literal["pass", "fail"] | None = None

    @computed_field
    @property
    def consensus(self) -> Literal["pass", "fail"]:
        if self.leader_override is not None:
            return self.leader_override
        return "pass" if self.pass_votes >= self.fail_votes else "fail"

    @computed_field
    @property
    def split(self) -> str:
        return f"{self.pass_votes}-{self.fail_votes}"

    @computed_field
    @property
    def contested(self) -> bool:
        total = self.pass_votes + self.fail_votes
        return total > 0 and min(self.pass_votes, self.fail_votes) / total >= 0.34


class Lesson(BaseModel):
    text: str
    knowledge_layer: KnowledgeLayer
    source_case_id: str
    author_role: str = "service_line_leader"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EvalCase(BaseModel):
    id: str
    source_case_id: str
    step: JudgedStep
    prompt: str
    expected: Literal["pass", "fail"]
    knowledge_layer: KnowledgeLayer
    rationale: str = ""


class PreferencePair(BaseModel):
    prompt: str
    chosen: str
    rejected: str
    knowledge_layer: KnowledgeLayer
    source_case_id: str


class JudgeAlignment(BaseModel):
    knowledge_layer: str
    n: int
    tpr: float
    tnr: float
    room_vs_outcome_agreement: float
    tool_vs_outcome_agreement: float


class CaseStudy(BaseModel):
    source_case_id: str
    hero_image_seed: int
    vignette: str
    scenario_narrations: list[str]
    verdict_summary: str
    outcome: Outcome | None
    lesson: Lesson | None
    knowledge_layer: KnowledgeLayer


class Session(BaseModel):
    id: str
    facilitator: str = "service_line_leader"
    case_ids: list[str] = Field(default_factory=list)
    active_case_id: str | None = None
    judgments: dict[str, list[Judgment]] = Field(default_factory=dict)  # keyed by case_id
    lessons: list[Lesson] = Field(default_factory=list)
    status: Literal["open", "closed"] = "open"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

