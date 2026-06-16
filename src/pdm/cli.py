from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from .runtime import run
from .schemas import PatientCase

app = typer.Typer(add_completion=False)
console = Console()


@app.command()
def main(
    case_file: Path = typer.Argument(..., exists=True, readable=True),
    memory_dir: Optional[Path] = typer.Option(None, "--memory-dir", help="Directory for institutional_memory.jsonl."),
    json_out: bool = typer.Option(False, "--json", help="Print full JSON result."),
) -> None:
    """Run the pneumonia discharge readiness reference workflow."""

    case = PatientCase.model_validate_json(case_file.read_text(encoding="utf-8"))
    result = run(case, memory_dir=memory_dir)

    if json_out:
        console.print_json(result.model_dump_json(indent=2))
        return

    console.print(f"[bold teal]Pneumonia Discharge Memory[/bold teal] patient={result.patient_id}")
    table = Table(title="Synthetic Risk Scores")
    table.add_column("Score")
    table.add_column("Value")
    table.add_column("Band")
    for score in result.scores:
        table.add_row(score.name, str(score.value), score.band)
    console.print(table)

    console.print(f"[bold]Disposition:[/bold] {result.handoff.disposition}")
    console.print(result.handoff.summary)
    if result.handoff.red_flags:
        console.print("[bold red]Red flags[/bold red]")
        for flag in result.handoff.red_flags:
            console.print(f"- {flag}")
    console.print("[bold]What-if scenarios[/bold]")
    for scenario in result.scenarios:
        console.print(f"- {scenario.name}: delta={scenario.readmission_risk_delta:+.3f}")


if __name__ == "__main__":
    app()

