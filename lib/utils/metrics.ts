// AI generated functions for calculating user's WPM and accuracy

export type Metrics = {
  correctChars: number;
  totalChars: number;
  accuracy: number; // 0..1
  correctCompletedWords: number;
  wpm: number;
};

export function computeMetrics(
  target: string,
  typed: string,
  elapsedMs: number
): Metrics {
  const totalChars = Math.min(typed.length, target.length);
  let correctChars = 0;

  for (let i = 0; i < totalChars; i++) {
    if (typed[i] === target[i]) correctChars++;
  }

  const targetWords = target.split(" ");
  const typedWords = typed.split(" ");

  let correctCompletedWords = 0;

  const wordsToCheck = Math.min(typedWords.length, targetWords.length);

  for (let i = 0; i < wordsToCheck; i++) {
    const wordOk = typedWords[i] === targetWords[i];
    const finishedBoundary =
      i < typedWords.length - 1 ||
      (i === wordsToCheck - 1 &&
        typedWords[i].length === targetWords[i].length);
    if (wordOk && finishedBoundary) correctCompletedWords++;
  }

  const minutes = Math.max(elapsedMs / 60000, 1 / 60000); // avoid div-by-zero
  const wpm = correctCompletedWords / minutes;
  const accuracy = totalChars === 0 ? 1 : correctChars / totalChars;

  return { correctChars, totalChars, accuracy, correctCompletedWords, wpm };
}
