from __future__ import annotations

import tempfile
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from .proof import prove_case, prove_cohort
from .schemas import PatientCase

app = typer.Typer(add_completion=False)
console = Console()

COHORT = [
    "examples/patients/pneumonia_case_001.json",
    "examples/patients/pneumonia_case_002_low_risk.json",
    "examples/patients/pneumonia_case_003_missing_data.json",
]


@app.command()
def main(
    case_file: Path = typer.Argument(..., exists=True, readable=True),
    json_out: bool = typer.Option(False, "--json", help="Print the full proof artifact as JSON."),
    cohort: bool = typer.Option(False, "--cohort", help="Prove differentiated routing across the synthetic cohort."),
) -> None:
    """Run the pneumonia use case and prove HOMER-1 framework coverage.

    The proof always uses a fresh, isolated memory so generate-then-reuse is
    reproducible regardless of prior runs.
    """
    with tempfile.TemporaryDirectory() as tmp:
        if cohort:
            cases = [PatientCase.model_validate_json(Path(p).read_text(encoding="utf-8")) for p in COHORT]
            proof = prove_cohort(cases, memory_dir=Path(tmp))
            title = f"HOMER-1 Cohort Proof ({proof['cohort_size']} cases)"
        else:
            case = PatientCase.model_validate_json(case_file.read_text(encoding="utf-8"))
            proof = prove_case(case, memory_dir=Path(tmp))
            title = f"HOMER-1 Proof: {proof['case_id']}"

        if json_out:
            console.print_json(data=proof)
            raise typer.Exit(0 if proof["passed"] else 1)

        table = Table(title=title)
        table.add_column("Criterion")
        table.add_column("State")
        table.add_column("Status")
        table.add_column("Claim")
        for criterion in proof["criteria"]:
            table.add_row(
                criterion["id"],
                criterion["state"],
                "PASS" if criterion["passed"] else "FAIL",
                criterion["claim"],
            )
        console.print(table)
        if cohort:
            console.print(f"Dispositions: {proof['dispositions']}")
        console.print(f"Result: {proof['criteria_passed']}/{proof['criteria_total']} criteria passed")
        raise typer.Exit(0 if proof["passed"] else 1)


if __name__ == "__main__":
    app()
