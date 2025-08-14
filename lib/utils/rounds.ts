import { ROUND_SECONDS, SENTENCES } from "../constants";

export type RoundInfo = {
  id: number;
  endsAt: number;
  sentence: string;
};

export function getCurrentRound(now: number = Date.now()): RoundInfo {
  const id = Math.floor(now / (ROUND_SECONDS * 1000));

  const endsAt = (id + 1) * ROUND_SECONDS * 1000;

  const sentence = SENTENCES[id % SENTENCES.length];

  return { id, endsAt, sentence };
}
