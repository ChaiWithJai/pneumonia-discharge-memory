from pathlib import Path

from pdm.datalake import outcome_for
from pdm.evals import (
    AlignmentRecord,
    alignment,
    axial_taxonomy,
    build_eval_cases,
    build_preference_pairs,
)
from pdm.export import build_bundle
from pdm.memory import InstitutionalMemory
from pdm.schemas import Judgment, KnowledgeLayer, Lesson, PatientCase
from pdm.session import finalize_case, present, start_session


def load_case(name: str = "pneumonia_case_001.json") -> PatientCase:
    return PatientCase.model_validate_json(Path(f"examples/patients/{name}").read_text())


# --- data lake -----------------------------------------------------------------

def test_datalake_is_deterministic_and_labeled():
    a = outcome_for("synthetic-pna-001")
    b = outcome_for("synthetic-pna-001")
    assert a == b
    assert a.readmitted_30d is True and a.days_to_readmit == 9
    assert outcome_for("synthetic-pna-002-low-risk").readmitted_30d is False


# --- judgment ------------------------------------------------------------------

def test_judgment_consensus_and_override():
    j = Judgment(step="analyze", pass_votes=2, fail_votes=6, note="cultures pending")
    assert j.consensus == "fail"
    assert j.contested is False  # 25% minority — decisive
    assert Judgment(step="analyze", pass_votes=4, fail_votes=6).contested is True  # 40% minority
    assert Judgment(step="output", pass_votes=9, fail_votes=1).consensus == "pass"
    assert Judgment(step="output", pass_votes=9, fail_votes=1, leader_override="fail").consensus == "fail"


# --- alignment math ------------------------------------------------------------

def test_alignment_math_on_known_matrix():
    recs = [
        AlignmentRecord("service_line", tool_positive=True, room_positive=True, truth_positive=True),    # TP
        AlignmentRecord("service_line", tool_positive=False, room_positive=True, truth_positive=True),   # FN
        AlignmentRecord("service_line", tool_positive=False, room_positive=False, truth_positive=False), # TN
        AlignmentRecord("service_line", tool_positive=True, room_positive=False, truth_positive=False),  # FP
    ]
    by_layer = {a.knowledge_layer: a for a in alignment(recs)}
    overall = by_layer["overall"]
    assert overall.n == 4
    assert overall.tpr == 0.5
    assert overall.tnr == 0.5
    assert overall.room_vs_outcome_agreement == 1.0
    assert overall.tool_vs_outcome_agreement == 0.5


# --- taxonomy ------------------------------------------------------------------

def test_axial_taxonomy_clusters_notes():
    tax = axial_taxonomy(["pharmacy is 40 min away", "she lives alone", "cultures still pending", "looks fine"])
    cats = {t["category"] for t in tax}
    assert "medication_access" in cats
    assert "social_support" in cats
    assert "unresolved_infection" in cats
    assert "other" in cats


# --- full conference flow ------------------------------------------------------

def test_conference_finalize_persists_and_exports(tmp_path):
    memory = InstitutionalMemory(tmp_path)
    case = load_case()
    session = start_session("sess-1", [case.patient_id])
    runtime = present(case, memory)

    judgments = [
        Judgment(step="analyze", pass_votes=2, fail_votes=6, note="cultures pending, would not send home"),
        Judgment(step="simulate", pass_votes=7, fail_votes=1, note=""),
        Judgment(step="output", pass_votes=8, fail_votes=0, note=""),
    ]
    lesson = Lesson(text="lives-alone + high access-risk -> mandatory pharmacy follow-up",
                    knowledge_layer=KnowledgeLayer.SERVICE_LINE, source_case_id=case.patient_id)

    result = finalize_case(memory, session, case, runtime, judgments, lesson)
    assert result.outcome.readmitted_30d is True
    assert result.case_study.lesson is not None

    evals = build_eval_cases(runtime, judgments, KnowledgeLayer.SERVICE_LINE)
    memory.record_eval_cases(evals)
    prefs = build_preference_pairs(runtime, judgments, lesson, KnowledgeLayer.SERVICE_LINE)
    memory.record_preferences(prefs)

    # 3 eval cases; the analyze fail expected = "fail".
    assert len(evals) == 3
    assert next(e for e in evals if e.step == "analyze").expected == "fail"
    # one overturn (analyze) + one lesson pair = 2 preference pairs.
    assert len(prefs) == 2

    bundle = build_bundle(memory)
    assert bundle["counts"]["eval_cases"] == 3
    assert bundle["counts"]["preference_pairs"] == 2
    assert bundle["counts"]["lessons"] == 1
    assert "pharmacy follow-up" in bundle["case_studies_markdown"]
    assert any(a["knowledge_layer"] == "overall" for a in bundle["alignment"])


def test_insights_and_rule_suggestion(tmp_path):
    from pdm.insights import insights, suggest_rule

    memory = InstitutionalMemory(tmp_path)
    case = load_case()
    session = start_session("sess-i", [case.patient_id])
    runtime = present(case, memory)
    judgments = [
        Judgment(step="analyze", pass_votes=2, fail_votes=6, note="cultures pending, pharmacy far"),
        Judgment(step="simulate", pass_votes=7, fail_votes=1),
        Judgment(step="output", pass_votes=8, fail_votes=0),
    ]
    finalize_case(memory, session, case, runtime, judgments, None)
    memory.record_eval_cases(build_eval_cases(runtime, judgments, KnowledgeLayer.SERVICE_LINE))
    memory.record_preferences(build_preference_pairs(runtime, judgments, None, KnowledgeLayer.SERVICE_LINE))

    out = insights(memory, writer=None)  # offline
    assert out["advisor"] is None
    assert out["confusion"]["tp"] + out["confusion"]["fp"] + out["confusion"]["tn"] + out["confusion"]["fn"] == 1
    assert out["recommendations"], "expected at least one recommendation"
    assert all("principle" in r for r in out["recommendations"])
    assert "Hamel" in out["canon"]

    rule = suggest_rule(case, ["analyze"], writer=None)
    assert rule["source"] == "template"
    assert "IF" in rule["text"]


def test_prove_collector_end_to_end(tmp_path):
    from pdm.proof import prove_collector

    scripts = [
        (load_case("pneumonia_case_001.json"),
         [Judgment(step="analyze", pass_votes=2, fail_votes=6, note="cultures pending"),
          Judgment(step="simulate", pass_votes=7, fail_votes=1),
          Judgment(step="output", pass_votes=8, fail_votes=0)],
         Lesson(text="lives-alone + high access-risk -> pharmacy follow-up",
                knowledge_layer=KnowledgeLayer.SERVICE_LINE, source_case_id="synthetic-pna-001")),
        (load_case("pneumonia_case_002_low_risk.json"),
         [Judgment(step="analyze", pass_votes=9, fail_votes=0),
          Judgment(step="simulate", pass_votes=8, fail_votes=1),
          Judgment(step="output", pass_votes=9, fail_votes=0)],
         None),
    ]
    proof = prove_collector(scripts, memory_dir=tmp_path)
    assert proof["passed"] is True
    assert proof["criteria_passed"] == proof["criteria_total"]
