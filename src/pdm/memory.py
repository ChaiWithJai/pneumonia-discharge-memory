from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .schemas import PatientCase, RuntimeResult


def memory_event(case: PatientCase, result: RuntimeResult | None, artifacts: dict[str, Any]) -> dict[str, Any]:
    return {
        "event_type": "pneumonia_discharge_runtime_completed",
        "schema_version": "0.1.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "patient_id": case.patient_id,
        "service_line": "pulmonary",
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


def append_memory(memory_dir: Path, event: dict[str, Any]) -> Path:
    memory_dir.mkdir(parents=True, exist_ok=True)
    path = memory_dir / "institutional_memory.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, sort_keys=True) + "\n")
    return path


def read_memory(memory_dir: Path) -> list[dict[str, Any]]:
    path = memory_dir / "institutional_memory.jsonl"
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

