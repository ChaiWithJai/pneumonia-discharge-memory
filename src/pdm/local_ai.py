"""Local Bonsai adapters — text narration and image generation, offline-first.

Two on-device endpoints, both from the Bonsai ecosystem:

  * Writer      — `llama-server` (OpenAI-compatible) on :8080, Ternary-Bonsai-1.7B.
  * Illustrator — the Bonsai Image 4B studio on :8800, `POST /generate -> PNG`.

Everything degrades gracefully: if a server is down, callers fall back (the web
app paints a synchronous clinical canvas instead of a diffusion render, and the
Factory uses its deterministic blueprint instead of a model-proposed spec). No
patient data ever leaves the device; these are localhost calls by design.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass

from .schemas import WhatIfScenario

# Empathy guardrails applied to every image prompt. Dignity, not fear.
IMAGE_GUARDRAILS = (
    "respectful clinical illustration, soft warm light, painterly, hopeful, "
    "no identifiable patient likeness, no medical gore, no fear tactics, no text"
)


@dataclass
class BonsaiWriter:
    """Local text model adapter (Ternary-Bonsai via llama-server)."""

    base_url: str = "http://127.0.0.1:8080"
    model: str = "ternary-bonsai-1.7b"
    timeout_seconds: int = 30

    def available(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.base_url}/v1/models", method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except (urllib.error.URLError, TimeoutError, OSError):
            return False

    def complete(self, prompt: str, system: str | None = None, max_tokens: int = 220, temperature: float = 0.4) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload = {"model": self.model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        req = urllib.request.Request(
            f"{self.base_url}/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()


@dataclass
class BonsaiImageStudio:
    """Local diffusion adapter (Bonsai Image 4B studio).

    Contract verified against the live studio: POST /generate with
    {prompt, seed, steps, width, height} returns raw PNG bytes. The studio sends
    no CORS headers, so browsers must reach it through our same-origin proxy.
    """

    base_url: str = "http://127.0.0.1:8800"
    timeout_seconds: int = 120  # cold first render compiles kernels; warm is ~6s

    def available(self) -> bool:
        try:
            with urllib.request.urlopen(f"{self.base_url}/docs", timeout=2) as resp:
                return resp.status == 200
        except (urllib.error.URLError, TimeoutError, OSError):
            return False

    def generate(self, prompt: str, width: int = 512, height: int = 512, steps: int = 4, seed: int = 7) -> bytes:
        payload = {"prompt": prompt, "seed": seed, "steps": steps, "width": width, "height": height}
        req = urllib.request.Request(
            f"{self.base_url}/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            return resp.read()


def empathy_image_prompt(scenario: WhatIfScenario) -> str:
    """Compose the guarded diffusion prompt for a what-if scenario."""
    return f"{scenario.empathy_prompt} {IMAGE_GUARDRAILS}"


SYSTEM_NARRATION = (
    "You are a compassionate discharge nurse writing 2-3 sentences in plain language "
    "for a care team. Describe what this discharge scenario would feel like for the "
    "patient at home. Be dignified and concrete. Never give medical advice, never "
    "diagnose, never use fear. This is a synthetic teaching scenario."
)
