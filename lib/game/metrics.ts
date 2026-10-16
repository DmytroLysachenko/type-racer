import { characters, sameCharacter } from "./characters";

export type Metrics = {
  correctChars: number;
  totalChars: number;
  totalTypedChars: number;
  mistakes: number;
  correctedErrors: number;
  uncorrectedErrors: number;
  accuracy: number;
  rawWpm: number;
  wpm: number;
  cpm: number;
  elapsedMs: number;
};

/** One character means one visible grapheme cluster, including whitespace and punctuation.
 * Raw speed counts all inserted characters, including ones later erased. Net speed
 * counts characters currently correct at their target position. Both use five
 * characters per conventional word. Zero elapsed time always gives zero speed.
 */
export function computeMetrics(
  target: string,
  typed: string,
  elapsedMs: number,
  totals: { totalTypedChars?: number; mistakes?: number } = {},
): Metrics {
  const expected = characters(target);
  const entered = characters(typed).slice(0, expected.length);
  const totalChars = entered.length;
  let correctChars = 0;
  for (let i = 0; i < totalChars; i++) {
    if (sameCharacter(entered[i]!, expected[i]!)) correctChars++;
  }
  const uncorrectedErrors = totalChars - correctChars;
  const totalTypedChars = Math.max(
    totalChars,
    totals.totalTypedChars ?? totalChars,
  );
  const mistakes = Math.max(
    uncorrectedErrors,
    totals.mistakes ?? uncorrectedErrors,
  );
  const minutes =
    Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs / 60000 : 0;
  return {
    correctChars,
    totalChars,
    totalTypedChars,
    mistakes,
    correctedErrors: mistakes - uncorrectedErrors,
    uncorrectedErrors,
    accuracy: totalChars === 0 ? 1 : correctChars / totalChars,
    rawWpm: minutes ? totalTypedChars / 5 / minutes : 0,
    wpm: minutes ? correctChars / 5 / minutes : 0,
    cpm: minutes ? correctChars / minutes : 0,
    elapsedMs: Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0),
  };
}
