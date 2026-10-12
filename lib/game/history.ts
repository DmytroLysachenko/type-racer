import type { Metrics } from "./metrics";

export type RaceRecord = {
  id: string;
  finishedAt: number;
  sentence: string;
  metrics: Metrics;
};

const KEY = "typearena-history-v1";
const MAX_RECORDS = 50;

export function readHistory(): RaceRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RaceRecord => {
        if (typeof item !== "object" || item === null) return false;
        const record = item as Partial<RaceRecord>;
        return (
          typeof record.id === "string" &&
          typeof record.finishedAt === "number" &&
          Number.isFinite(record.finishedAt) &&
          typeof record.sentence === "string" &&
          typeof record.metrics?.wpm === "number" &&
          Number.isFinite(record.metrics.wpm)
        );
      })
      .slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveRace(record: RaceRecord): RaceRecord[] {
  const history = [record, ...readHistory()].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // A full or disabled storage area must not interrupt typing.
  }
  window.dispatchEvent(new Event("typearena:history-updated"));
  return history;
}
