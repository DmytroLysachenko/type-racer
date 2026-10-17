import {
  frequentMistypedTargets,
  practiceRecommendation,
  reviewPassage,
  summarizeMistypedTargets,
} from "@/lib/game/insights";
import { computeMetrics } from "@/lib/game/metrics";
import type { RaceRecord } from "@/lib/game/history";

test("recent saved errors identify repeatedly missed target characters", () => {
  const base: RaceRecord = {
    id: "one",
    finishedAt: 1,
    sentence: "a b",
    metrics: computeMetrics("a b", "x b", 1000),
    mode: { kind: "timed", seconds: 30 },
    contentVersion: "v2",
    mistypedTargets: { a: 2, " ": 3, b: 1 },
  };
  const second = {
    ...base,
    id: "two",
    mistypedTargets: summarizeMistypedTargets({ a: 1, b: 1, " ": 1 }),
  };
  expect(second.mistypedTargets).toEqual({ a: 1, b: 1 });
  expect(frequentMistypedTargets([base, second])).toEqual(["a", "b"]);
  expect(reviewPassage([base, second])).toBe("a b");
});

test("recommendation uses actual result accuracy and corrections", () => {
  expect(practiceRecommendation(computeMetrics("a", "a", 1000))).toBeNull();
  expect(
    practiceRecommendation(computeMetrics("abcdefghij", "xxxxxxxxxx", 1000)),
  ).toContain("Slow down");
  expect(
    practiceRecommendation(
      computeMetrics("abcdefghij", "abcdefghij", 1000, {
        mistakes: 3,
        totalTypedChars: 13,
      }),
    ),
  ).toContain("recovered");
});
