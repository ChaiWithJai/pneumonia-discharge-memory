// THE CARE PATH — the safety floor (world bible B.4, loop plan §6).
//
// A service that senses distress carries a duty of care. When words or signals
// suggest genuine crisis (not a normal Hush), Ember must route to REAL human and
// crisis resources — plainly, immediately, outside the fiction — never gamified
// comfort, never the crew alone. This gate is deterministic, not a soft judge.
//
// IMPORTANT: the resources below are a responsible default and MUST be reviewed
// and localized with a professional partner before any real-person pilot
// (loop plan open decision #4). This code is the always-reachable plumbing; the
// clinical content is owned by that partner.

export type RiskLevel = "none" | "elevated" | "crisis";

export interface CareSignal {
  /** Free text the user typed, if any (a note, a check-in). */
  text?: string;
  /** Sustained severe Hush across many days. */
  hush?: number;
  /** Recent recovery/rest dimension, 0..1 (very low for long = a flag). */
  rest?: number;
  /** Consecutive days the country has gone untended. */
  lapseDays?: number;
}

// Phrases that always force the crisis path. Deliberately high-precision.
const CRISIS_PHRASES = [
  "kill myself",
  "want to die",
  "end my life",
  "suicide",
  "suicidal",
  "self harm",
  "self-harm",
  "hurt myself",
  "don't want to be here",
  "dont want to be here",
  "no reason to live",
  "better off dead",
];

export interface CareResource {
  label: string;
  detail: string;
  action?: string; // tel: or sms: or https:
}

// US-default resources. Localize with the care-path partner before launch.
export const CARE_RESOURCES: CareResource[] = [
  {
    label: "988 Suicide & Crisis Lifeline",
    detail: "Call or text 988 (US) — free, confidential, 24/7.",
    action: "tel:988",
  },
  {
    label: "Crisis Text Line",
    detail: "Text HOME to 741741 (US).",
    action: "sms:741741",
  },
  {
    label: "If you are in immediate danger",
    detail: "Call your local emergency number (911 in the US) right now.",
    action: "tel:911",
  },
  {
    label: "Find a human",
    detail: "Reach someone you trust and tell them how you feel. You do not have to hold this alone.",
  },
];

/** Deterministic assessment. High precision on text; conservative on signals. */
export function assess(signal: CareSignal): RiskLevel {
  const text = (signal.text ?? "").toLowerCase();
  if (text && CRISIS_PHRASES.some((p) => text.includes(p))) return "crisis";

  // Signal-only flags never claim crisis on their own (we don't diagnose), but
  // a prolonged, severe collapse surfaces a gentle, explicit offer of help.
  const severeHush = (signal.hush ?? 0) >= 0.85;
  const longLapse = (signal.lapseDays ?? 0) >= 14;
  const restCollapse = signal.rest !== undefined && signal.rest <= 0.1;
  if ((severeHush && longLapse) || (longLapse && restCollapse)) return "elevated";

  return "none";
}

export interface CareCheck {
  level: RiskLevel;
  routed: boolean; // must the UI route to the care path now?
  resources: CareResource[];
}

export function careCheck(signal: CareSignal): CareCheck {
  const level = assess(signal);
  return {
    level,
    routed: level === "crisis",
    resources: CARE_RESOURCES,
  };
}
