import { ROUND_SECONDS } from "@/lib/game/config";
import { computeMetrics, type Metrics } from "./metrics";

export type RacePhase = "ready" | "running" | "completed";
export type RaceState = {
  phase: RacePhase;
  typed: string;
  startedAtMs: number | null;
  elapsedMs: number;
  totalTypedChars: number;
  mistakes: number;
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

/** Accept only an append of one code point or one backspace at the end. */
export function inputRace(
  state: RaceState,
  target: string,
  proposed: string,
  nowMs: number,
  durationMs = RACE_DURATION_MS,
): RaceState {
  const current = tickRace(state, target, nowMs, durationMs);
  if (current.phase === "completed") return current;
  const before = Array.from(current.typed);
  const after = Array.from(proposed);
  const append =
    after.length === before.length + 1 &&
    before.every((ch, i) => ch === after[i]);
  const backspace =
    after.length === before.length - 1 &&
    after.every((ch, i) => ch === before[i]);
  if (!append && !backspace) return current;
  if (append && after.length > Array.from(target).length) return current;
  if (current.phase === "ready" && backspace) return current;
  const startedAtMs = current.startedAtMs ?? nowMs;
  const totalTypedChars = current.totalTypedChars + (append ? 1 : 0);
  const mistakes =
    current.mistakes +
    (append && after.at(-1) !== Array.from(target)[after.length - 1] ? 1 : 0);
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const next: RaceState = {
    ...current,
    phase: "running",
    typed: proposed,
    startedAtMs,
    elapsedMs,
    totalTypedChars,
    mistakes,
  };
  if (proposed === target)
    return {
      ...next,
      phase: "completed",
      result: computeMetrics(target, proposed, elapsedMs, next),
    };
  return next;
}
