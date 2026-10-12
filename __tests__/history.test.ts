import { readHistory, saveRace } from "@/lib/game/history";
import { computeMetrics } from "@/lib/game/metrics";

beforeEach(() => localStorage.clear());
test("corrupt history is ignored and a completed race persists", () => {
  localStorage.setItem("typearena-history-v1", "not json");
  expect(readHistory()).toEqual([]);
  saveRace({
    id: "one",
    finishedAt: 123,
    sentence: "abc",
    metrics: computeMetrics("abc", "abc", 1000),
  });
  expect(readHistory()).toHaveLength(1);
  expect(readHistory()[0]!.metrics.correctChars).toBe(3);
});
test("history is bounded to 50 sessions", () => {
  for (let i = 0; i < 53; i++)
    saveRace({
      id: String(i),
      finishedAt: i,
      sentence: "a",
      metrics: computeMetrics("a", "a", 1000),
    });
  expect(readHistory()).toHaveLength(50);
  expect(readHistory()[0]!.id).toBe("52");
});
