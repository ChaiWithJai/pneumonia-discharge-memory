"""Local web server for the Pneumonia Discharge Memory studio.

Stdlib only, no build step — the same covenant as the web app it serves. It hosts
a single self-contained page and a small API, and (crucially) proxies image and
narration requests server-to-server so the browser never hits a CORS wall:

    GET  /                      -> the studio page
    GET  /api/config            -> server + model availability, case list
    GET  /api/cases             -> available synthetic patient cases
    GET  /api/run?case=NAME     -> run the governed runtime (shared memory, compounds)
    GET  /api/proof?case=NAME   -> single-case HOMER-1 proof (fresh memory)
    GET  /api/cohort            -> differentiated-routing cohort proof
    GET  /api/memory            -> institutional-memory state (the acceleration curve)
    POST /illustrate            -> proxy to Bonsai Image studio /generate (PNG)
    POST /narrate               -> proxy to Bonsai writer (empathy narration)
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import urllib.error
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import typer

from .local_ai import SYSTEM_NARRATION, BonsaiImageStudio, BonsaiWriter
from .memory import InstitutionalMemory
from .proof import prove_case, prove_cohort
from .runtime import run
from .schemas import PatientCase

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / "web" / "index.html"
PATIENTS = ROOT / "examples" / "patients"
RUNTIME_MEMORY = ROOT / "examples" / "memory" / "web_runtime"

WRITER = BonsaiWriter(os.environ.get("BONSAI_WRITER_URL", "http://127.0.0.1:8080"))
STUDIO = BonsaiImageStudio(os.environ.get("BONSAI_STUDIO_URL", "http://127.0.0.1:8800"))

COHORT_FILES = [
    "pneumonia_case_001.json",
    "pneumonia_case_002_low_risk.json",
    "pneumonia_case_003_missing_data.json",
]


def _cases() -> list[str]:
    return sorted(p.name for p in PATIENTS.glob("*.json"))


def _load_case(name: str) -> PatientCase:
    safe = Path(name).name  # no traversal
    return PatientCase.model_validate_json((PATIENTS / safe).read_text(encoding="utf-8"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"{self.address_string()} - {fmt % args}")

    # --- helpers ---------------------------------------------------------------
    def _json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw or b"{}")

    # --- routes ----------------------------------------------------------------
    def do_GET(self) -> None:
        url = urlparse(self.path)
        path, query = url.path, parse_qs(url.query)
        try:
            if path in {"/", "/index.html"}:
                self._serve_page()
            elif path == "/api/config":
                self._json(
                    {
                        "writer_available": WRITER.available(),
                        "studio_available": STUDIO.available(),
                        "writer_url": WRITER.base_url,
                        "studio_url": STUDIO.base_url,
                        "cases": _cases(),
                    }
                )
            elif path == "/api/cases":
                self._json(_cases())
            elif path == "/api/run":
                case = _load_case(query.get("case", ["pneumonia_case_001.json"])[0])
                result = run(case, memory=InstitutionalMemory(RUNTIME_MEMORY))
                self._json(result.model_dump(mode="json"))
            elif path == "/api/proof":
                case = _load_case(query.get("case", ["pneumonia_case_001.json"])[0])
                with tempfile.TemporaryDirectory() as tmp:
                    self._json(prove_case(case, memory_dir=Path(tmp)))
            elif path == "/api/cohort":
                cases = [_load_case(n) for n in COHORT_FILES]
                with tempfile.TemporaryDirectory() as tmp:
                    self._json(prove_cohort(cases, memory_dir=Path(tmp)))
            elif path == "/api/memory":
                self._json(self._memory_state())
            else:
                self._json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        except FileNotFoundError:
            self._json({"error": "unknown case"}, HTTPStatus.NOT_FOUND)
        except Exception as exc:  # pragma: no cover - surfaced to the page
            self._json({"error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self) -> None:
        url = urlparse(self.path)
        try:
            if url.path == "/illustrate":
                self._illustrate()
            elif url.path == "/narrate":
                self._narrate()
            else:
                self._json({"error": "not found"}, HTTPStatus.NOT_FOUND)
        except Exception as exc:  # pragma: no cover
            self._json({"error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    # --- implementations -------------------------------------------------------
    def _serve_page(self) -> None:
        body = PAGE.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _memory_state(self) -> dict[str, Any]:
        mem = InstitutionalMemory(RUNTIME_MEMORY)
        events = mem.events()
        return {
            "tools_in_memory": mem.tool_count(),
            "runs_completed": mem.runs_completed(),
            "cumulative_steps_saved": mem.cumulative_steps_saved(),
            "tools": sorted(p.name for p in mem.tools_dir.glob("*.py")) if mem.tools_dir.exists() else [],
            "timeline": [
                {"type": e["type"], "name": e.get("name"), "run_index": e.get("run_index"), "patient_id": e.get("patient_id")}
                for e in events
            ],
        }

    def _illustrate(self) -> None:
        body = self._body()
        prompt = body.get("prompt", "")
        if not prompt:
            self._json({"error": "prompt required"}, HTTPStatus.BAD_REQUEST)
            return
        try:
            png = STUDIO.generate(
                prompt,
                width=int(body.get("width", 512)),
                height=int(body.get("height", 512)),
                steps=int(body.get("steps", 4)),
                seed=int(body.get("seed", 7)),
            )
        except (urllib.error.URLError, TimeoutError, OSError):
            self._json({"error": "image studio unreachable", "studio_url": STUDIO.base_url}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(png)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(png)

    def _narrate(self) -> None:
        body = self._body()
        prompt = body.get("prompt", "")
        if not prompt:
            self._json({"error": "prompt required"}, HTTPStatus.BAD_REQUEST)
            return
        try:
            text = WRITER.complete(prompt, system=SYSTEM_NARRATION, max_tokens=160)
            self._json({"text": text, "source": "bonsai"})
        except (urllib.error.URLError, TimeoutError, OSError):
            self._json({"error": "writer unreachable", "writer_url": WRITER.base_url}, HTTPStatus.SERVICE_UNAVAILABLE)


app = typer.Typer(add_completion=False)


@app.command()
def main(host: str = "127.0.0.1", port: int = 8765, fresh: bool = True) -> None:
    """Serve the Pneumonia Discharge Memory studio.

    By default the institutional memory starts fresh so the first run shows a cold
    Factory generating tools, and later runs show reuse (the acceleration curve).
    """
    if fresh and RUNTIME_MEMORY.exists():
        shutil.rmtree(RUNTIME_MEMORY)
    print(f"Pneumonia Discharge Memory studio  ->  http://{host}:{port}/")
    print(f"  writer (text):  {WRITER.base_url}  [{'up' if WRITER.available() else 'offline — clinical-text fallback'}]")
    print(f"  studio (image): {STUDIO.base_url}  [{'up' if STUDIO.available() else 'offline — clinical-canvas fallback'}]")
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    app()
