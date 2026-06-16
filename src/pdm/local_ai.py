from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass


@dataclass
class BonsaiTextClient:
    """OpenAI-compatible local text endpoint adapter.

    Aligned with the local Bonsai llama-server pattern:
    http://127.0.0.1:8080/v1/chat/completions
    """

    base_url: str = "http://127.0.0.1:8080"
    model: str = "ternary-bonsai-1.7b"
    timeout_seconds: int = 30

    def complete(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        }
        req = urllib.request.Request(
            f"{self.base_url}/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


@dataclass
class BonsaiImagePrompt:
    prompt: str
    size: str = "1248x832"
    safety_note: str = "Do not include identifiable patients, gore, fear tactics, or real chart data."


def empathy_image_prompts(scenarios: list) -> list[BonsaiImagePrompt]:
    return [BonsaiImagePrompt(prompt=s.empathy_prompt) for s in scenarios]

