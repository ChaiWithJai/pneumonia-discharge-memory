// The Ledger's local persistence, behind an interface. v1 = localStorage;
// IndexedDb/Remote drop in later (spec). "Your record is yours."

import type { EmberSave } from "../types";
import type { Trace } from "../loops/studio";

export interface EmberStore {
  load(): EmberSave | null;
  save(s: EmberSave): void;
  loadTraces(): Trace[];
  saveTraces(t: Trace[]): void;
  wipe(): void;
  exportJSON(): string;
}
