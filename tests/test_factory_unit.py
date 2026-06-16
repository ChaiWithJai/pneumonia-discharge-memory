from pathlib import Path

from pdm.factory import (
    blueprint_specs,
    compile_tool,
    extract_inputs,
    neutral_inputs,
    synthesize_source,
    validate_tool,
)
from pdm.schemas import PatientCase


def load_case() -> PatientCase:
    return PatientCase.model_validate_json(Path("examples/patients/pneumonia_case_001.json").read_text())


def test_every_blueprint_compiles_validates_and_runs():
    case = load_case()
    for spec in blueprint_specs():
        source = synthesize_source(spec)
        assert "def score(values):" in source
        fn = compile_tool(source)
        passed, report = validate_tool(spec, fn)
        assert passed, report
        value, _evidence = fn(extract_inputs(case, spec.inputs))
        assert 0.0 <= value <= 1.0


def test_generated_frailty_matches_hand_computation():
    spec = next(s for s in blueprint_specs() if s.name == "frailty_index_calculator")
    fn = compile_tool(synthesize_source(spec))
    value, evidence = fn(extract_inputs(load_case(), spec.inputs))
    assert value == 0.8
    assert any(e["key"] == "mobility.current_mobility_drop" for e in evidence)


def test_neutral_inputs_score_zero():
    for spec in blueprint_specs():
        fn = compile_tool(synthesize_source(spec))
        value, _ = fn(neutral_inputs(spec))
        assert value == 0.0


def test_generated_source_has_no_eval_or_imports():
    for spec in blueprint_specs():
        source = synthesize_source(spec)
        assert "eval(" not in source
        assert "import " not in source
        assert "__" not in source.replace("__builtins__", "")  # no dunder shenanigans in body
