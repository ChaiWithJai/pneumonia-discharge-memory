"""Institutional memory: the stateful substrate that makes the runtime compound.

This is the difference between a stateless answer engine and HOMER-1's thesis.
Every run reads this store *before* it reasons. Generated clinical tools are
persisted here as executable source and **reused** on later runs instead of being
rebuilt — so the marginal cost of each additional case falls. The store is keyed
by service line so the pulmonary line's tools carry forward to the next pulmonary
use case (pneumonia -> COPD flare -> adherence) without starting from zero.

No PHI. Synthetic demo only. Stdlib only, append-only JSONL + plain-text tool
artifacts a reviewer can open and read.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .schemas import CaseStudy, EvalCase, GeneratedTool, Lesson, PreferencePair, ToolSpec


class InstitutionalMemory:
    def __init__(self, root: Path, service_line: str = "pulmonary") -> None:
        self.root = Path(root)
        self.service_line = service_line
        self.tools_dir = self.root / "tools"
        self.manifest = self.root / "manifest.jsonl"

    # --- lifecycle -------------------------------------------------------------
    def ensure(self) -> None:
        self.tools_dir.mkdir(parents=True, exist_ok=True)

    def _append(self, event: dict[str, Any]) -> None:
        self.ensure()
        with self.manifest.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event, sort_keys=True) + "\n")

    # --- events ----------------------------------------------------------------
    def events(self) -> list[dict[str, Any]]:
        if not self.manifest.exists():
            return []
        return [json.loads(line) for line in self.manifest.read_text(encoding="utf-8").splitlines() if line.strip()]

    def runs_completed(self) -> int:
        return sum(1 for e in self.events() if e.get("type") == "case_completed")

    def next_run_index(self) -> int:
        return self.runs_completed() + 1

    # --- generated tools (the reusable engineering artifacts) ------------------
    def _tool_path(self, name: str, version: str) -> Path:
        return self.tools_dir / f"{name}@{version}.py"

    def _meta_path(self, name: str, version: str) -> Path:
        return self.tools_dir / f"{name}@{version}.json"

    def has_tool(self, name: str, version: str) -> bool:
        return self._tool_path(name, version).exists() and self._meta_path(name, version).exists()

    def load_tool_source(self, name: str, version: str) -> str:
        return self._tool_path(name, version).read_text(encoding="utf-8")

    def load_tool_spec(self, name: str, version: str) -> ToolSpec:
        meta = json.loads(self._meta_path(name, version).read_text(encoding="utf-8"))
        return ToolSpec.model_validate(meta["spec"])

    def save_tool(self, tool: GeneratedTool) -> None:
        self.ensure()
        self._tool_path(tool.name, tool.version).write_text(tool.source_code, encoding="utf-8")
        self._meta_path(tool.name, tool.version).write_text(
            json.dumps(tool.model_dump(mode="json"), indent=2, sort_keys=True), encoding="utf-8"
        )
        self._append(
            {
                "type": "tool_generated",
                "service_line": self.service_line,
                "name": tool.name,
                "version": tool.version,
                "generated_by": tool.generated_by,
                "run_index": tool.run_index,
                "validation_passed": tool.validation_passed,
                "created_at": tool.created_at.isoformat(),
            }
        )

    def record_tool_reuse(self, name: str, version: str, run_index: int) -> None:
        self._append(
            {
                "type": "tool_reused",
                "service_line": self.service_line,
                "name": name,
                "version": version,
                "run_index": run_index,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    def tool_count(self) -> int:
        return len(list(self.tools_dir.glob("*.py"))) if self.tools_dir.exists() else 0

    # --- case completion -------------------------------------------------------
    def record_case(self, event: dict[str, Any]) -> None:
        self._append(event)

    def record_event(self, event: dict[str, Any]) -> None:
        self._append(event)

    def cumulative_steps_saved(self) -> int:
        return sum(1 for e in self.events() if e.get("type") == "tool_reused")

    # --- collector artifacts (lessons, case studies, evals, preferences) -------
    def _append_jsonl(self, name: str, obj: Any) -> Path:
        self.ensure()
        path = self.root / name
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(obj, sort_keys=True) + "\n")
        return path

    def _read_jsonl(self, name: str) -> list[dict[str, Any]]:
        path = self.root / name
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def record_lesson(self, lesson: Lesson) -> None:
        self._append_jsonl("lessons.jsonl", lesson.model_dump(mode="json"))

    def load_lessons(self) -> list[dict[str, Any]]:
        return self._read_jsonl("lessons.jsonl")

    def record_case_study(self, study: CaseStudy) -> None:
        self._append_jsonl("case_studies.jsonl", study.model_dump(mode="json"))

    def load_case_studies(self) -> list[dict[str, Any]]:
        return self._read_jsonl("case_studies.jsonl")

    def record_eval_cases(self, cases: list[EvalCase]) -> None:
        for case in cases:
            self._append_jsonl("evals.jsonl", case.model_dump(mode="json"))

    def load_eval_cases(self) -> list[dict[str, Any]]:
        return self._read_jsonl("evals.jsonl")

    def record_preferences(self, pairs: list[PreferencePair]) -> None:
        for pair in pairs:
            self._append_jsonl("preferences.jsonl", pair.model_dump(mode="json"))

    def load_preferences(self) -> list[dict[str, Any]]:
        return self._read_jsonl("preferences.jsonl")


def case_event(case_id: str, run_index: int, service_line: str, artifacts: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "case_completed",
        "schema_version": "0.2.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "patient_id": case_id,
        "run_index": run_index,
        "service_line": service_line,
        "domain": "pneumonia_discharge",
        "reusable_assets": [
            "frailty_index_calculator",
            "secondary_infection_risk_classifier",
            "environmental_medication_access_rules",
            "whatif_discharge_scenarios",
            "structured_human_handoff_template",
        ],
        "future_reuse_targets": ["copd_flare_up", "asthma_exacerbation", "post_discharge_medication_adherence"],
        "artifacts": artifacts,
        "note": "Synthetic demo event. Do not store PHI.",
    }
