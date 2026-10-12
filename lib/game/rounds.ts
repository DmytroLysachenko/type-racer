import {
  LOBBY_SECONDS,
  RESULTS_SECONDS,
  ROUND_SECONDS,
  SENTENCES,
} from "./config";

export type RoundPhase = "lobby" | "racing" | "results";
export const ROUND_CYCLE_MS =
  (LOBBY_SECONDS + ROUND_SECONDS + RESULTS_SECONDS) * 1000;

export type RoundInfo = {
  id: number;
  phase: RoundPhase;
  startsAt: number;
  endsAt: number;
  resultsEndAt: number;
  phaseEndsAt: number;
  sentence: string;
};

export function getCurrentRound(now: number = Date.now()): RoundInfo {
  const id = Math.floor(now / ROUND_CYCLE_MS);
  const startsAt = id * ROUND_CYCLE_MS + LOBBY_SECONDS * 1000;
  const endsAt = startsAt + ROUND_SECONDS * 1000;
  const resultsEndAt = (id + 1) * ROUND_CYCLE_MS;
  const phase: RoundPhase =
    now < startsAt ? "lobby" : now < endsAt ? "racing" : "results";
  const phaseEndsAt =
    phase === "lobby" ? startsAt : phase === "racing" ? endsAt : resultsEndAt;
  // The bundled passage list is intentionally nonempty.
  const sentence = SENTENCES[id % SENTENCES.length]!;

  return { id, phase, startsAt, endsAt, resultsEndAt, phaseEndsAt, sentence };
}
