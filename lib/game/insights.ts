import type { RaceRecord } from "./history";
import type { Metrics } from "./metrics";

/** Keep a small, truthful summary of the target characters that caused errors. */
export function summarizeMistypedTargets(
  counts: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts)
      .filter(
        ([character, count]) =>
          character.trim() && Number.isInteger(count) && count > 0,
      )
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      )
      .slice(0, 16),
  );
}

export function frequentMistypedTargets(records: RaceRecord[]): string[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    for (const [character, count] of Object.entries(
      record.mistypedTargets ?? {},
    )) {
      if (!character.trim() || !Number.isInteger(count) || count < 1) continue;
      totals.set(character, (totals.get(character) ?? 0) + count);
    }
  }
  return [...totals]
    .filter(([, count]) => count >= 2)
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 3)
    .map(([character]) => character);
}

/** Reuse a rights-safe passage that actually produced the learner's error. */
export function reviewPassage(records: RaceRecord[]): string | null {
  const character = frequentMistypedTargets(records)[0];
  if (!character) return null;
  return (
    [...records]
      .filter((record) => (record.mistypedTargets?.[character] ?? 0) > 0)
      .sort(
        (left, right) =>
          (right.mistypedTargets?.[character] ?? 0) -
          (left.mistypedTargets?.[character] ?? 0),
      )[0]?.sentence ?? null
  );
}

export function practiceRecommendation(metrics: Metrics): string | null {
  if (metrics.totalChars < 10) return null;
  if (metrics.accuracy < 0.9)
    return "Slow down for the next run and aim for clean, deliberate keystrokes.";
  if (metrics.correctedErrors >= 3)
    return "You recovered from several errors. Try another run at the same pace with fewer corrections.";
  if (metrics.accuracy >= 0.98 && metrics.wpm >= 40)
    return "Accuracy is steady. A challenge passage can add punctuation and longer words.";
  return "Repeat this mode once more to see whether you can keep the same rhythm.";
}
