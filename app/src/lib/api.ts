import type {
  Bundle,
  Config,
  FinalizeResponse,
  Insights,
  JudgmentInput,
  MemoryState,
  Outcome,
  PresentResponse,
  RuleSuggestion,
} from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return (await r.json()) as T;
}

export const api = {
  config: () => getJSON<Config>("/api/config"),
  memory: () => getJSON<MemoryState>("/api/memory"),
  bundle: () => getJSON<Bundle>("/api/export/bundle"),
  insights: () => getJSON<Insights>("/api/insights"),

  suggestRule: async (caseFile: string, failedSteps: string[]): Promise<RuleSuggestion | null> => {
    try {
      const r = await fetch("/api/conference/suggest-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case: caseFile, failed_steps: failedSteps }),
      });
      if (!r.ok) return null;
      return (await r.json()) as RuleSuggestion;
    } catch {
      return null;
    }
  },
  present: (caseFile: string) =>
    getJSON<PresentResponse>(`/api/conference/present?case=${encodeURIComponent(caseFile)}`),
  outcome: (caseId: string) =>
    getJSON<Outcome>(`/api/conference/outcome?case_id=${encodeURIComponent(caseId)}`),

  finalize: async (body: {
    case: string;
    judgments: JudgmentInput[];
    lesson: { text: string; knowledge_layer: string } | null;
    knowledge_layer: string;
  }): Promise<FinalizeResponse> => {
    // Map the boolean lever to the backend's tally shape (1/0).
    const payload = {
      ...body,
      judgments: body.judgments.map((j) => ({
        step: j.step,
        pass_votes: j.verdict === "pass" ? 1 : 0,
        fail_votes: j.verdict === "fail" ? 1 : 0,
        note: j.note,
      })),
    };
    const r = await fetch("/api/conference/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as FinalizeResponse;
  },

  // Returns an object URL for the rendered PNG, or null if the studio is offline.
  illustrate: async (prompt: string, seed: number): Promise<string | null> => {
    try {
      const r = await fetch("/illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, seed, width: 512, height: 512, steps: 4 }),
      });
      if (!r.ok) return null;
      return URL.createObjectURL(await r.blob());
    } catch {
      return null;
    }
  },

  narrate: async (prompt: string): Promise<{ text: string; source: string } | null> => {
    try {
      const r = await fetch("/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) return null;
      return (await r.json()) as { text: string; source: string };
    } catch {
      return null;
    }
  },
};
