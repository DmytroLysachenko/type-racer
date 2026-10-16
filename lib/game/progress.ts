import { ROUND_SECONDS } from "@/lib/game/config";
import { computeMetrics } from "./metrics";
import { characters } from "./characters";

export type ProgressPayload = {
  playerId: string;
  name: string;
  roundId: number;
  typed: string;
  totalTypedChars: number;
  mistakes: number;
  elapsedMs: number;
  completed: boolean;
};

/** Treat Pusher events as untrusted data; never render supplied score fields. */
export function parseProgress(
  value: unknown,
  roundId: number,
  sentence: string,
): ProgressPayload | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Partial<ProgressPayload>;
  const targetLength = characters(sentence).length;
  // Bound UTF-16 size before grapheme segmentation of untrusted text.
  if (typeof p.typed === "string" && p.typed.length > targetLength * 16)
    return null;
  const length = typeof p.typed === "string" ? characters(p.typed).length : -1;
  if (
    typeof p.playerId !== "string" ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(p.playerId) ||
    typeof p.name !== "string" ||
    !p.name.trim() ||
    p.name.length > 32 ||
    p.roundId !== roundId ||
    typeof p.typed !== "string" ||
    length > targetLength ||
    !Number.isSafeInteger(p.totalTypedChars) ||
    p.totalTypedChars! < length ||
    p.totalTypedChars! > 1000 ||
    !Number.isSafeInteger(p.mistakes) ||
    p.mistakes! < 0 ||
    p.mistakes! > p.totalTypedChars! ||
    typeof p.elapsedMs !== "number" ||
    !Number.isFinite(p.elapsedMs) ||
    p.elapsedMs < 0 ||
    p.elapsedMs > ROUND_SECONDS * 1000 ||
    typeof p.completed !== "boolean" ||
    // Reject physically implausible finished attempts; this is abuse control,
    // not proof that the remaining client-supplied input came from a human.
    (p.completed &&
      p.totalTypedChars! >= 10 &&
      p.elapsedMs < p.totalTypedChars! * 30)
  )
    return null;
  return {
    playerId: p.playerId,
    name: p.name,
    roundId: p.roundId,
    typed: p.typed,
    totalTypedChars: p.totalTypedChars,
    mistakes: p.mistakes,
    elapsedMs: p.elapsedMs,
    completed: p.completed,
  } as ProgressPayload;
}

export function rankProgress(rows: ProgressPayload[], sentence: string) {
  return rows
    .map((row) => ({
      ...row,
      metrics: computeMetrics(sentence, row.typed, row.elapsedMs, row),
    }))
    .sort(
      (a, b) =>
        b.metrics.wpm - a.metrics.wpm ||
        b.metrics.accuracy - a.metrics.accuracy ||
        b.metrics.correctChars - a.metrics.correctChars ||
        a.name.localeCompare(b.name),
    );
}

/** Accept only newer snapshots from the same racer. Backspace may shorten typed,
 * but elapsed time and lifetime counters cannot move backwards. A final frame
 * is immutable, so delayed Pusher events cannot erase the results view. */
export function mergeProgress(
  previous: ProgressPayload | undefined,
  next: ProgressPayload,
): ProgressPayload | null {
  if (!previous) return next;
  if (
    previous.playerId !== next.playerId ||
    previous.roundId !== next.roundId ||
    previous.completed ||
    next.elapsedMs < previous.elapsedMs ||
    next.totalTypedChars < previous.totalTypedChars ||
    next.mistakes < previous.mistakes
  )
    return null;
  if (
    next.elapsedMs === previous.elapsedMs &&
    next.totalTypedChars === previous.totalTypedChars &&
    next.typed === previous.typed &&
    next.completed === previous.completed
  )
    return null;
  return next;
}
