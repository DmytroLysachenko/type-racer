import { computeMetrics } from "@/lib/utils/metrics";

describe("computeMetrics", () => {
  const sentence = "The quick brown fox";

  it("returns perfect accuracy and correct WPM for exact match", () => {
    const elapsedMs = 60000; // 1 minute
    const result = computeMetrics(sentence, sentence, elapsedMs);

    expect(result.correctChars).toBe(sentence.length);
    expect(result.totalChars).toBe(sentence.length);
    expect(result.accuracy).toBe(1);
    // sentence has 4 words, so 4 WPM in 1 minute
    expect(result.correctCompletedWords).toBe(4);
    expect(result.wpm).toBe(4);
  });

  it("handles partial typing with mistakes", () => {
    const typed = "The quxck brown"; // 'quick' has 'x' instead of 'i'
    const result = computeMetrics(sentence, typed, 60000);

    expect(result.totalChars).toBe(typed.length);
    // should have some incorrect chars
    expect(result.correctChars).toBeLessThan(result.totalChars);
    expect(result.accuracy).toBeCloseTo(
      result.correctChars / result.totalChars
    );
    // 'The' and 'brown' are correct full words, 'quick' has mistake
    expect(result.correctCompletedWords).toBe(2);
  });

  it("does not count last word if incomplete", () => {
    const typed = "The quick brow"; // missing 'n'
    const result = computeMetrics(sentence, typed, 60000);

    expect(result.correctCompletedWords).toBe(2); // 'The', 'quick' only
  });

  it("avoids division by zero when elapsedMs = 0", () => {
    const result = computeMetrics(sentence, "The", 0);
    expect(result.wpm).toBeGreaterThan(0);
  });

  it("returns accuracy 1 when nothing typed", () => {
    const result = computeMetrics(sentence, "", 1000);
    expect(result.accuracy).toBe(1);
    expect(result.correctChars).toBe(0);
    expect(result.correctCompletedWords).toBe(0);
  });
});
