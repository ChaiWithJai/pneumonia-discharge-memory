import type { EmberSave } from "../types";
import type { Trace } from "../loops/studio";
import type { EmberStore } from "./EmberStore";

const SAVE_KEY = "ember.save.v1";
const TRACE_KEY = "ember.traces.v1";

export class LocalStorageStore implements EmberStore {
  load(): EmberSave | null {
    return read<EmberSave>(SAVE_KEY);
  }
  save(s: EmberSave): void {
    write(SAVE_KEY, s);
  }
  loadTraces(): Trace[] {
    return read<Trace[]>(TRACE_KEY) ?? [];
  }
  saveTraces(t: Trace[]): void {
    write(TRACE_KEY, t.slice(-500)); // keep the tail bounded
  }
  wipe(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(TRACE_KEY);
    } catch {
      /* ignore */
    }
  }
  exportJSON(): string {
    return JSON.stringify(
      { save: this.load(), traces: this.loadTraces() },
      null,
      2,
    );
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — Ember still works in-session */
  }
}
