// AI generated functions for calculating user's WPM and accuracy

export function computeWPM(charsTyped: number, msElapsed: number) {
  const words = charsTyped / 5;
  const minutes = msElapsed / 60000;
  return minutes > 0 ? Math.round((words / minutes) * 10) / 10 : 0;
}

export function computeAccuracy(target: string, input: string) {
  const len = Math.max(target.length, input.length) || 1;
  let correct = 0;
  for (let i = 0; i < Math.min(target.length, input.length); i++) {
    if (target[i] === input[i]) correct++;
  }
  return Math.round((correct / len) * 1000) / 10; // e.g. 97.3
}
