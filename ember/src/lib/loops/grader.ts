// LOOP 2 — THE GRADER. The Facilitator Rubric, enforced in code (loop plan §4,
// non-negotiable #4). Every companion-voice string is graded BEFORE it can
// reach a human. Guilt / shame / streak-debt / scarcity / medical-claim
// language fails. Failing output is replaced by a safe fallback, never shown.

export interface Violation {
  rule: string;
  snippet: string;
}

export interface Grade {
  pass: boolean;
  violations: Violation[];
}

interface Rule {
  id: string;
  // matched case-insensitively against the output
  patterns: RegExp[];
}

// The banned registers. Each is a refusal from the world bible's fence.
const RULES: Rule[] = [
  {
    id: "no-guilt-shame",
    patterns: [
      /\byou (failed|messed up|screwed up|let .* down)\b/i,
      /\b(you should have|you ought to have|shame on you|guilty|your fault)\b/i,
      /\byou (neglected|abandoned|ignored)\b/i,
      /\bdisappointed in you\b/i,
    ],
  },
  {
    id: "no-streak-debt",
    patterns: [
      /\b(streak|catch up|caught up|make up for|behind|fell behind|lost progress)\b/i,
      /\b(broke|broken|lost) (your|the) (streak|progress|momentum)\b/i,
      /\b(\d+|days?) (in a row|day streak)\b/i,
      /\byou owe\b/i,
    ],
  },
  {
    id: "no-scarcity-fomo",
    patterns: [
      /\b(limited time|act now|only \d+ left|don'?t miss|last chance|expires|hurry|while you can)\b/i,
      /\b(exclusive|unlock now|claim (it|your)|before it'?s gone)\b/i,
    ],
  },
  {
    id: "no-medical-claims",
    patterns: [
      /\b(diagnos|cure|treats? your|prescrib|symptom of|you have (a|an) .*(disorder|disease|condition))\b/i,
      /\b(your (heart|body) is (broken|failing|damaged))\b/i,
    ],
  },
  {
    id: "no-pressure-command",
    patterns: [
      /\byou (must|have to|need to) (do this|come back|open the app|keep going)\b/i,
      /\bif you don'?t\b[^.]*\b(you|your ember)\b[^.]*\bwill\b[^.]*\b(die|fade|lose|fail)\b/i,
    ],
  },
];

export function grade(output: string): Grade {
  const violations: Violation[] = [];
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const m = output.match(re);
      if (m) violations.push({ rule: rule.id, snippet: m[0] });
    }
  }
  return { pass: violations.length === 0, violations };
}

// A guaranteed-safe line if a generated output ever fails the rubric.
export const SAFE_FALLBACK =
  "Your ember is here. Whatever today held, it held too. Begin again whenever you like.";

/** Grade, and substitute the safe fallback if the rubric fails. */
export function gradeOrFallback(output: string): { text: string; grade: Grade } {
  const g = grade(output);
  return { text: g.pass ? output : SAFE_FALLBACK, grade: g };
}
