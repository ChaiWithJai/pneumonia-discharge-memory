from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from .proof import prove_case
from .schemas import PatientCase

app = typer.Typer(add_completion=False)
console = Console()


@app.command()
def main(
    case_file: Path = typer.Argument(..., exists=True, readable=True),
    memory_dir: Optional[Path] = typer.Option(Path("examples/memory/proof"), "--memory-dir", help="Directory for proof memory writes."),
    json_out: bool = typer.Option(False, "--json", help="Print the full proof artifact as JSON."),
) -> None:
    """Run the pneumonia use case and prove HOMER-1 framework coverage."""

    case = PatientCase.model_validate_json(case_file.read_text(encoding="utf-8"))
    proof = prove_case(case, memory_dir=memory_dir or Path("examples/memory/proof"))

    if json_out:
        console.print_json(data=proof)
        raise typer.Exit(0 if proof["passed"] else 1)

    table = Table(title=f"HOMER-1 Proof: {proof['case_id']}")
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
    console.print(f"Result: {proof['criteria_passed']}/{proof['criteria_total']} criteria passed")
    raise typer.Exit(0 if proof["passed"] else 1)


if __name__ == "__main__":
    app()
