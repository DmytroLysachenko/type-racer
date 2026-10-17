import type { Metrics } from "./metrics";
import { characters } from "./characters";
import {
  PRACTICE_DURATIONS,
  PRACTICE_FOCUS_MODES,
  PRACTICE_WORD_COUNTS,
  type PracticeMode,
} from "./practice";

export type ResultMode = { kind: "shared" } | PracticeMode;

export type RaceRecord = {
  id: string;
  finishedAt: number;
  sentence: string;
  metrics: Metrics;
  mistypedTargets?: Record<string, number>;
  mode: ResultMode;
  contentVersion: string;
};

const KEY = "typearena-history-v2";
const LEGACY_KEY = "typearena-history-v1";
const MAX_RECORDS = 50;

function validTimestamp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 8.64e15
  );
}

function validMode(value: unknown): value is ResultMode {
  if (!value || typeof value !== "object") return false;
  const mode = value as Partial<ResultMode>;
  if (mode.kind === "shared") return true;
  if (mode.kind === "timed")
    return PRACTICE_DURATIONS.some(
      (option) => option === (mode as { seconds?: number }).seconds,
    );
  if (mode.kind === "words")
    return PRACTICE_WORD_COUNTS.some(
      (option) => option === (mode as { count?: number }).count,
    );
  if (mode.kind === "custom") return true;
  if (PRACTICE_FOCUS_MODES.some((option) => option.kind === mode.kind))
    return true;
  return false;
}

function validMetrics(value: unknown): value is Metrics {
  if (!value || typeof value !== "object") return false;
  const metrics = value as Partial<Metrics>;
  const nonnegative: (keyof Metrics)[] = [
    "correctChars",
    "totalChars",
    "totalTypedChars",
    "mistakes",
    "correctedErrors",
    "uncorrectedErrors",
    "rawWpm",
    "wpm",
    "cpm",
    "elapsedMs",
  ];
  return (
    nonnegative.every(
      (key) =>
        typeof metrics[key] === "number" &&
        Number.isFinite(metrics[key]) &&
        metrics[key]! >= 0,
    ) &&
    typeof metrics.accuracy === "number" &&
    Number.isFinite(metrics.accuracy) &&
    metrics.accuracy >= 0 &&
    metrics.accuracy <= 1 &&
    metrics.correctChars! <= metrics.totalChars! &&
    metrics.totalChars! <= metrics.totalTypedChars!
  );
}

function validMistypedTargets(value: unknown, mistakes: number): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 16 &&
    entries.every(
      ([character, count]) =>
        character.trim().length > 0 &&
        character.length <= 32 &&
        characters(character).length === 1 &&
        typeof count === "number" &&
        Number.isInteger(count) &&
        count > 0 &&
        count <= 10000,
    ) &&
    entries.reduce((sum, [, count]) => sum + (count as number), 0) <= mistakes
  );
}

function validRecord(value: unknown): value is RaceRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<RaceRecord>;
  return (
    typeof record.id === "string" &&
    record.id.length <= 64 &&
    validTimestamp(record.finishedAt) &&
    typeof record.sentence === "string" &&
    record.sentence.length <= 10000 &&
    validMetrics(record.metrics) &&
    validMistypedTargets(record.mistypedTargets, record.metrics.mistakes) &&
    validMode(record.mode) &&
    typeof record.contentVersion === "string" &&
    /^v[1-9]\d*$/.test(record.contentVersion)
  );
}

function readLegacyHistory(): RaceRecord[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(LEGACY_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Omit<RaceRecord, "mode" | "contentVersion"> => {
        if (typeof item !== "object" || item === null) return false;
        const record = item as Partial<RaceRecord>;
        return (
          typeof record.id === "string" &&
          record.id.length <= 64 &&
          validTimestamp(record.finishedAt) &&
          typeof record.sentence === "string" &&
          record.sentence.length <= 1000 &&
          validMetrics(record.metrics)
        );
      })
      .map((record) => ({
        ...record,
        mode: { kind: "shared" } as const,
        contentVersion: "v1",
      }))
      .slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function readHistory(): RaceRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        parsed.version === 2 &&
        "records" in parsed &&
        Array.isArray(parsed.records)
      )
        return parsed.records.filter(validRecord).slice(0, MAX_RECORDS);
    }
  } catch {
    // A damaged new record set must not hide older results.
  }
  return readLegacyHistory();
}

/** Report persistence failure so the UI can tell a guest their result is at risk. */
export function saveRace(record: RaceRecord): boolean {
  const history = [record, ...readHistory()].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, records: history }));
    window.dispatchEvent(new Event("typearena:history-updated"));
    return true;
  } catch {
    window.dispatchEvent(new Event("typearena:storage-failed"));
    return false;
  }
}

/** Only the browser's validated, device-local records are exported. */
export function exportHistory(): string {
  return JSON.stringify({ version: 2, records: readHistory() }, null, 2);
}

export function clearHistory(): boolean {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new Event("typearena:history-updated"));
    return true;
  } catch {
    window.dispatchEvent(new Event("typearena:storage-failed"));
    return false;
  }
}
