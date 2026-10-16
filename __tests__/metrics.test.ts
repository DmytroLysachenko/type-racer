import { computeMetrics } from "@/lib/game/metrics";

describe("five-character typing metrics", () => {
  test("reports raw, net, CPM and accuracy with punctuation and spaces", () => {
    const result = computeMetrics("Hello, world!", "Hello, worxd!", 60_000);
    expect(result.totalChars).toBe(13);
    expect(result.correctChars).toBe(12);
    expect(result.rawWpm).toBeCloseTo(13 / 5);
    expect(result.wpm).toBeCloseTo(12 / 5);
    expect(result.cpm).toBe(12);
    expect(result.accuracy).toBeCloseTo(12 / 13);
    expect(result.uncorrectedErrors).toBe(1);
  });
  test("counts visible Unicode characters rather than UTF-16 units", () => {
    const result = computeMetrics("A😀 é", "A😀 é", 60_000);
    expect(result.totalChars).toBe(4);
    expect(result.wpm).toBeCloseTo(0.8);
  });
  test("joined emoji and canonically equivalent accents count once", () => {
    const result = computeMetrics("👨‍👩‍👧‍👦 é", "👨‍👩‍👧‍👦 e\u0301", 60_000);
    expect(result.totalChars).toBe(3);
    expect(result.correctChars).toBe(3);
    expect(result.accuracy).toBe(1);
  });
  test("includes erased input in raw speed and reports corrections", () => {
    const result = computeMetrics("abc", "abc", 60_000, {
      totalTypedChars: 5,
      mistakes: 2,
    });
    expect(result.rawWpm).toBe(1);
    expect(result.wpm).toBeCloseTo(0.6);
    expect(result.correctedErrors).toBe(2);
    expect(result.uncorrectedErrors).toBe(0);
  });
  test("zero and invalid elapsed time have zero speed", () => {
    for (const elapsed of [0, -1, NaN]) {
      const result = computeMetrics("abc", "abc", elapsed);
      expect(result.wpm).toBe(0);
      expect(result.rawWpm).toBe(0);
      expect(result.cpm).toBe(0);
    }
  });
  test("empty input has 100 percent accuracy without inflated speed", () => {
    const result = computeMetrics("abc", "", 1000);
    expect(result.accuracy).toBe(1);
    expect(result.wpm).toBe(0);
  });
});
