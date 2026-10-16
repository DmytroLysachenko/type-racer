import { ROUND_SECONDS } from "@/lib/game/config";
import { computeMetrics, type Metrics } from "./metrics";
import { characters, sameCharacter } from "./characters";

export type RacePhase = "ready" | "running" | "completed";
export type RaceState = {
  phase: RacePhase;
  typed: string;
  startedAtMs: number | null;
  elapsedMs: number;
  totalTypedChars: number;
  mistakes: number;
  mistypedTargets: Record<string, number>;
  result: Metrics | null;
};

export const RACE_DURATION_MS = ROUND_SECONDS * 1000;

export function createRace(): RaceState {
  return {
    phase: "ready",
    typed: "",
    startedAtMs: null,
    elapsedMs: 0,
    totalTypedChars: 0,
    mistakes: 0,
    mistypedTargets: {},
    result: null,
  };
}

export function tickRace(
  state: RaceState,
  target: string,
  nowMs: number,
  durationMs = RACE_DURATION_MS,
): RaceState {
  if (state.phase !== "running" || state.startedAtMs === null) return state;
  const elapsedMs = Math.max(0, nowMs - state.startedAtMs);
  if (elapsedMs < durationMs) return { ...state, elapsedMs };
  const result = computeMetrics(target, state.typed, durationMs, state);
  return { ...state, phase: "completed", elapsedMs: durationMs, result };
}

/** Freeze a started attempt when the shared round enters results. */
export function finishRace(
  state: RaceState,
  target: string,
  elapsedMs: number,
): RaceState {
  if (state.phase !== "running") return state;
  const elapsed = Math.max(0, Math.min(RACE_DURATION_MS, elapsedMs));
  return {
    ...state,
    phase: "completed",
    elapsedMs: elapsed,
    result: computeMetrics(target, state.typed, elapsed, state),
  };
}

/** Accept one visible character, one backspace, or an in-progress grapheme edit. */
export function inputRace(
  state: RaceState,
  target: string,
  proposed: string,
  nowMs: number,
  durationMs = RACE_DURATION_MS,
): RaceState {
  const current = tickRace(state, target, nowMs, durationMs);
  if (current.phase === "completed") return current;
  const before = characters(current.typed);
  const after = characters(proposed);
  const expected = characters(target);
  const append =
    after.length === before.length + 1 &&
    before.every((ch, i) => ch === after[i]);
  const backspace =
    after.length === before.length - 1 &&
    after.every((ch, i) => ch === before[i]);
  const lastBefore = before.at(-1);
  const lastAfter = after.at(-1);
  const adjustLast =
    before.length > 0 &&
    after.length === before.length &&
    before.slice(0, -1).every((ch, i) => ch === after[i]) &&
    lastBefore !== lastAfter &&
    !!lastBefore &&
    !!lastAfter &&
    (lastAfter.startsWith(lastBefore) || lastBefore.startsWith(lastAfter));
  if (!append && !backspace && !adjustLast) return current;
  if (append && after.length > expected.length) return current;
  if (current.phase === "ready" && backspace) return current;
  const startedAtMs = current.startedAtMs ?? nowMs;
  const totalTypedChars = current.totalTypedChars + (append ? 1 : 0);
  const newMistake =
    (append && !sameCharacter(lastAfter!, expected[after.length - 1]!)) ||
    (adjustLast &&
      sameCharacter(lastBefore!, expected[after.length - 1]!) &&
      !sameCharacter(lastAfter!, expected[after.length - 1]!));
  const mistakes = current.mistakes + (newMistake ? 1 : 0);
  const expectedCharacter = expected[after.length - 1];
  const mistypedTargets =
    newMistake && expectedCharacter
      ? {
          ...current.mistypedTargets,
          [expectedCharacter]:
            (current.mistypedTargets[expectedCharacter] ?? 0) + 1,
        }
      : current.mistypedTargets;
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const next: RaceState = {
    ...current,
    phase: "running",
    typed: proposed,
    startedAtMs,
    elapsedMs,
    totalTypedChars,
    mistakes,
    mistypedTargets,
  };
  if (
    after.length === expected.length &&
    after.every((ch, index) => sameCharacter(ch, expected[index]!))
  )
    return {
      ...next,
      phase: "completed",
      result: computeMetrics(target, proposed, elapsedMs, next),
    };
  return next;
}

/** Accept a browser IME commit as an append or final-grapheme replacement. Ordinary
 * input continues to use inputRace, so a pasted string is still rejected. */
export function commitComposition(
  state: RaceState,
  target: string,
  proposed: string,
  nowMs: number,
  durationMs = RACE_DURATION_MS,
): RaceState {
  const adjusted = inputRace(state, target, proposed, nowMs, durationMs);
  if (adjusted !== state && adjusted.typed === proposed) return adjusted;
  const before = characters(state.typed);
  const after = characters(proposed);
  const appended =
    after.length > before.length &&
    before.every((character, index) => character === after[index]);
  const replacedLast =
    before.length > 0 &&
    before.slice(0, -1).every((character, index) => character === after[index]);
  const prefixLength = appended
    ? before.length
    : replacedLast
      ? before.length - 1
      : -1;
  const committed = after.length - prefixLength;
  if (
    prefixLength < 0 ||
    committed < 1 ||
    committed > 16 ||
    after.length > characters(target).length
  )
    return state;
  let next = state;
  if (replacedLast && !appended)
    next = inputRace(
      next,
      target,
      before.slice(0, -1).join(""),
      nowMs,
      durationMs,
    );
  for (let index = prefixLength + 1; index <= after.length; index++) {
    next = inputRace(
      next,
      target,
      after.slice(0, index).join(""),
      nowMs,
      durationMs,
    );
  }
  return next;
}
