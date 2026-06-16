"""The Factory: generative toolchain assembly with reuse.

This is HOMER-1's most distinctive claim made literal. The Factory does not ship
hand-written calculators. It takes a clinical objective, derives typed tool
*specs* (deterministically by default, or proposed by a local Bonsai model when
one is running), and **generates executable Python source** for each instrument.
That source is validated, then persisted to institutional memory. On the next run
the tool is *reused* from memory instead of regenerated — the acceleration curve.

Safety: generated code is pure arithmetic over pre-extracted, typed inputs. There
is no eval of patient data and no network or filesystem access inside a tool. The
generated source is plain, readable Python a clinician-engineer can audit.
"""

from __future__ import annotations

from typing import Any, Callable

from .memory import InstitutionalMemory
from .schemas import (
    EvidenceItem,
    FactoryReport,
    GeneratedTool,
    Instrument,
    PatientCase,
    Score,
    ToolRule,
    ToolSpec,
)

OBJECTIVE = (
    "Assess pneumonia discharge readiness across clinical stability, unresolved "
    "infection risk, and non-clinical (environmental/medication-access) risk, with "
    "a mandatory human handoff."
)


# --- input extraction ----------------------------------------------------------

def get_path(case: PatientCase, path: str) -> Any:
    """Read a dotted path off the case, plus a few named derived signals."""
    if path == "social.isolated":
        return case.social.lives_alone and not case.social.caregiver_available
    obj: Any = case
    for part in path.split("."):
        obj = getattr(obj, part)
    return obj


def extract_inputs(case: PatientCase, inputs: list[str]) -> dict[str, Any]:
    return {path: get_path(case, path) for path in inputs}


# --- deterministic blueprint (objective -> typed tool specs) -------------------
#
# These mirror the reference clinical logic exactly, but expressed as data the
# Factory compiles into code. Swapping a Bonsai-proposed spec in here is a drop-in.

def blueprint_specs() -> list[ToolSpec]:
    return [
        ToolSpec(
            name="frailty_index_calculator",
            version="0.2.0",
            purpose="Estimate discharge fragility from age, mobility, falls, nutrition, and recent utilization.",
            score_name="frailty_index",
            inputs=["age", "mobility.current_mobility_drop", "mobility.falls_last_6_months", "mobility.nutrition_risk", "prior_admissions_6_months"],
            rules=[
                ToolRule(input="age", kind="threshold", op=">=", threshold=70, weight=0.1),
                ToolRule(input="age", kind="threshold", op=">=", threshold=80, weight=0.1, surface_evidence=True, interpretation="Advanced age contributes to frailty burden."),
                ToolRule(input="mobility.current_mobility_drop", kind="map", mapping={"none": 0.0, "mild": 0.12, "moderate": 0.26, "severe": 0.4}, surface_evidence=True, source_label="synthetic mobility assessment", interpretation="Mobility decline is a discharge support signal."),
                ToolRule(input="mobility.falls_last_6_months", kind="scaled", weight=0.06, cap=0.18),
                ToolRule(input="mobility.nutrition_risk", kind="map", mapping={"low": 0.0, "moderate": 0.08, "high": 0.16}),
                ToolRule(input="prior_admissions_6_months", kind="scaled", weight=0.06, cap=0.18),
            ],
            validation_checks=["bounded score 0-1", "empty input yields zero", "review high-frailty cases"],
            limitations=["Synthetic scoring only", "Not clinically validated", "Requires local calibration before real use"],
        ),
        ToolSpec(
            name="secondary_infection_risk_classifier",
            version="0.2.0",
            purpose="Flag unresolved infection concern from WBC trajectory, procalcitonin trend, cultures, and fever clock.",
            score_name="secondary_infection_risk",
            inputs=["labs.wbc_current", "labs.wbc_48h_delta", "labs.procalcitonin_trend", "labs.cultures_pending", "vitals.afebrile_hours"],
            rules=[
                ToolRule(input="labs.wbc_current", kind="threshold", op=">=", threshold=14, weight=0.22),
                ToolRule(input="labs.wbc_48h_delta", kind="threshold", op=">", threshold=1.0, weight=0.24, surface_evidence=True, source_label="synthetic labs", interpretation="Rising WBC triggers recursive review."),
                ToolRule(input="labs.procalcitonin_trend", kind="map", mapping={"rising": 0.24, "flat": 0.1, "falling": 0.0, "unknown": 0.0}),
                ToolRule(input="labs.cultures_pending", kind="flag", weight=0.12),
                ToolRule(input="vitals.afebrile_hours", kind="threshold", op="<", threshold=48, weight=0.18, surface_evidence=True, source_label="synthetic vitals", interpretation="Clinical stability should be reconfirmed before discharge."),
            ],
            validation_checks=["borderline values escalate to clinician review", "culture-pending state preserved", "rising markers increase risk"],
            limitations=["Synthetic rule-based demo", "Not clinically validated", "No antimicrobial recommendation", "No replacement for infectious disease review"],
        ),
        ToolSpec(
            name="environmental_medication_access_rules",
            version="0.2.0",
            purpose="Represent non-clinical discharge risks that drive avoidable readmission.",
            score_name="environmental_medication_access_risk",
            inputs=["meds.med_access_risk", "meds.adherence_concern", "social.pharmacy_access_minutes", "social.isolated", "social.health_literacy_risk"],
            rules=[
                ToolRule(input="meds.med_access_risk", kind="map", mapping={"low": 0.0, "moderate": 0.14, "high": 0.28}),
                ToolRule(input="meds.adherence_concern", kind="flag", weight=0.2),
                ToolRule(input="social.pharmacy_access_minutes", kind="threshold", op=">", threshold=30, weight=0.16, surface_evidence=True, source_label="synthetic SDOH", interpretation="Medication access may require delivery or support."),
                ToolRule(input="social.isolated", kind="flag", weight=0.16),
                ToolRule(input="social.health_literacy_risk", kind="map", mapping={"low": 0.0, "moderate": 0.08, "high": 0.16}),
            ],
            validation_checks=["no protected-class inference", "explain each access-risk flag", "route high access risk to support planning"],
            limitations=["Synthetic SDOH placeholder", "Not clinically validated", "Requires vetted SDOH data and fairness review"],
        ),
    ]


# --- code generation -----------------------------------------------------------

def _rule_source(rule: ToolRule, idx: int) -> str:
    ev = ""
    if rule.surface_evidence:
        ev = (
            f'\n        evidence.append({{"key": {rule.input!r}, "value": _v, '
            f'"source": {rule.source_label!r}, "interpretation": {rule.interpretation!r}}})'
        )
    if rule.kind == "threshold":
        return (
            f'    # rule {idx}: {rule.input} {rule.op} {rule.threshold} -> +{rule.weight}\n'
            f'    _v = values.get({rule.input!r})\n'
            f'    if _v is not None and _v {rule.op} {rule.threshold}:\n'
            f'        contribution += {rule.weight}{ev}\n'
        )
    if rule.kind == "flag":
        return (
            f'    # rule {idx}: flag {rule.input} -> +{rule.weight}\n'
            f'    _v = values.get({rule.input!r})\n'
            f'    if _v:\n'
            f'        contribution += {rule.weight}{ev}\n'
        )
    if rule.kind == "map":
        return (
            f'    # rule {idx}: map {rule.input}\n'
            f'    _v = values.get({rule.input!r})\n'
            f'    _w = {rule.mapping!r}.get(_v, 0.0)\n'
            f'    contribution += _w\n'
            + (f'    if _w > 0:{ev}\n' if rule.surface_evidence else '')
        )
    if rule.kind == "scaled":
        cap = rule.cap if rule.cap is not None else 1.0
        return (
            f'    # rule {idx}: scaled {rule.input} * {rule.weight} (cap {cap})\n'
            f'    _v = values.get({rule.input!r}) or 0\n'
            f'    contribution += min(_v * {rule.weight}, {cap})\n'
        )
    raise ValueError(f"unknown rule kind: {rule.kind}")


def synthesize_source(spec: ToolSpec) -> str:
    header = (
        f'"""Auto-generated by the HOMER-1 Factory. Do not hand-edit.\n\n'
        f'Instrument : {spec.name}@{spec.version}\n'
        f'Score      : {spec.score_name}\n'
        f'Purpose    : {spec.purpose}\n'
        f'Origin     : {spec.origin}\n'
        f'Inputs     : {", ".join(spec.inputs)}\n'
        f'"""\n\n'
    )
    body = "def score(values):\n    contribution = 0.0\n    evidence = []\n"
    for i, rule in enumerate(spec.rules):
        body += _rule_source(rule, i)
    body += "    total = min(round(contribution, 3), 1.0)\n    return total, evidence\n"
    return header + body


def compile_tool(source: str) -> Callable[[dict[str, Any]], tuple[float, list[dict[str, Any]]]]:
    namespace: dict[str, Any] = {"__builtins__": {"min": min, "max": max, "round": round}}
    code = compile(source, "<generated-tool>", "exec")
    exec(code, namespace)  # noqa: S102 - source is Factory-generated, not user input
    return namespace["score"]


# --- validation of a freshly generated tool ------------------------------------

def neutral_inputs(spec: ToolSpec) -> dict[str, Any]:
    """The lowest-risk value for every input: the point where no rule should fire."""
    out: dict[str, Any] = {}
    for rule in spec.rules:
        if rule.kind == "map" and rule.mapping:
            out[rule.input] = min(rule.mapping, key=rule.mapping.get)
        elif rule.kind == "flag":
            out[rule.input] = False
        elif rule.kind == "scaled":
            out[rule.input] = 0
        elif rule.kind == "threshold":
            # choose a value on the non-triggering side of the comparison
            out[rule.input] = -1e9 if rule.op in (">", ">=") else 1e9
    return out


def validate_tool(spec: ToolSpec, fn: Callable) -> tuple[bool, list[str]]:
    report: list[str] = []
    ok = True

    neutral_score, _ = fn(neutral_inputs(spec))
    if abs(neutral_score) < 1e-9:
        report.append("neutral (no-trigger) inputs -> 0.0 (pass)")
    else:
        ok = False
        report.append(f"neutral inputs did not yield 0.0 (got {neutral_score}) (FAIL)")

    # Saturate every input and confirm the score stays bounded in [0, 1].
    big: dict[str, Any] = {}
    for rule in spec.rules:
        if rule.kind == "map" and rule.mapping:
            big[rule.input] = max(rule.mapping, key=rule.mapping.get)
        elif rule.kind == "flag":
            big[rule.input] = True
        else:
            big[rule.input] = 10_000
    sat_score, _ = fn(big)
    if 0.0 <= sat_score <= 1.0:
        report.append(f"saturated inputs bounded at {sat_score} in [0,1] (pass)")
    else:
        ok = False
        report.append(f"saturated score out of bounds: {sat_score} (FAIL)")

    return ok, report


# --- band + score helpers ------------------------------------------------------

def band_for(spec: ToolSpec, value: float) -> str:
    if value >= spec.high_threshold:
        return "high"
    if value >= spec.moderate_threshold:
        return "moderate"
    return "low"


def spec_to_instrument(spec: ToolSpec) -> Instrument:
    return Instrument(
        name=spec.name,
        version=spec.version,
        purpose=spec.purpose,
        inputs=spec.inputs,
        validation_checks=spec.validation_checks,
        limitations=spec.limitations,
    )


# --- the assemble step ---------------------------------------------------------

class AssembledFactory:
    def __init__(
        self,
        specs: list[ToolSpec],
        callables: dict[str, Callable],
        report: FactoryReport,
        generated: list[GeneratedTool],
    ) -> None:
        self.specs = specs
        self.callables = callables
        self.report = report
        self.generated = generated

    def instruments(self) -> list[Instrument]:
        return [spec_to_instrument(s) for s in self.specs]

    def score(self, case: PatientCase) -> list[Score]:
        scores: list[Score] = []
        for spec in self.specs:
            values = extract_inputs(case, spec.inputs)
            value, raw_evidence = self.callables[spec.score_name](values)
            evidence = [EvidenceItem(**e) for e in raw_evidence]
            scores.append(Score(name=spec.score_name, value=value, band=band_for(spec, value), evidence=evidence))
        return scores


def assemble(
    case: PatientCase,
    memory: InstitutionalMemory,
    designer: "object | None" = None,
) -> AssembledFactory:
    """Reuse-or-generate every instrument the objective requires.

    `designer`, if provided and available, may propose specs from natural language
    (a local Bonsai model). Otherwise the deterministic blueprint is used. Either
    way, the *source* is generated, validated, persisted, and reused on later runs.
    """
    run_index = memory.next_run_index()
    specs = blueprint_specs()
    origin = "deterministic_blueprint"
    if designer is not None and getattr(designer, "available", lambda: False)():
        try:
            proposed = designer.propose(OBJECTIVE, specs)
            if proposed:
                specs = proposed
                origin = "bonsai_proposed"
        except Exception:  # pragma: no cover - any model hiccup falls back safely
            specs = blueprint_specs()

    callables: dict[str, Callable] = {}
    generated_tools: list[GeneratedTool] = []
    generated_names: list[str] = []
    reused_names: list[str] = []

    for spec in specs:
        spec.origin = origin
        if memory.has_tool(spec.name, spec.version):
            source = memory.load_tool_source(spec.name, spec.version)
            callables[spec.score_name] = compile_tool(source)
            memory.record_tool_reuse(spec.name, spec.version, run_index)
            reused_names.append(spec.name)
        else:
            source = synthesize_source(spec)
            fn = compile_tool(source)
            passed, report = validate_tool(spec, fn)
            tool = GeneratedTool(
                name=spec.name,
                version=spec.version,
                spec=spec,
                source_code=source,
                generated_by=origin,
                run_index=run_index,
                validation_passed=passed,
                validation_report=report,
            )
            memory.save_tool(tool)
            callables[spec.score_name] = fn
            generated_tools.append(tool)
            generated_names.append(spec.name)

    report = FactoryReport(
        run_index=run_index,
        tools_generated=generated_names,
        tools_reused=reused_names,
        engineering_steps_this_run=len(generated_names),
        engineering_steps_saved=len(reused_names),
        cumulative_tools_in_memory=memory.tool_count(),
    )
    return AssembledFactory(specs, callables, report, generated_tools)
