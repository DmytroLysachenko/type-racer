import {
  parseProgress,
  mergeProgress,
  rankProgress,
  type ProgressPayload,
} from "@/lib/game/progress";

const sentence = "hello world";
const good: ProgressPayload = {
  playerId: "player-1",
  name: "Racer",
  roundId: 1,
  typed: "hello",
  totalTypedChars: 5,
  mistakes: 0,
  elapsedMs: 1000,
  completed: true,
};

test("rejects malformed, oversized and cross-round peer events", () => {
  expect(parseProgress(good, 1, sentence)).toEqual(good);
  expect(parseProgress({ ...good, injected: "ignored" }, 1, sentence)).toEqual(
    good,
  );
  expect(parseProgress({ ...good, roundId: 2 }, 1, sentence)).toBeNull();
  expect(
    parseProgress({ ...good, typed: "x".repeat(100) }, 1, sentence),
  ).toBeNull();
  expect(parseProgress({ ...good, elapsedMs: -1 }, 1, sentence)).toBeNull();
  expect(parseProgress({ ...good, mistakes: 999 }, 1, sentence)).toBeNull();
  expect(
    parseProgress({ ...good, name: " ".repeat(4) }, 1, sentence),
  ).toBeNull();
  expect(
    parseProgress(
      { ...good, typed: "hello world", totalTypedChars: 11, elapsedMs: 1 },
      1,
      sentence,
    ),
  ).toBeNull();
});

test("peer progress counts joined emoji as one visible character", () => {
  const family = "👨‍👩‍👧‍👦";
  const progress = {
    ...good,
    typed: family,
    totalTypedChars: 1,
  };
  expect(parseProgress(progress, 1, `${family}x`)).toEqual(progress);
  expect(rankProgress([progress], `${family}x`)[0]?.metrics.correctChars).toBe(
    1,
  );
});

test("ignores delayed snapshots and freezes completed results", () => {
  const advanced = { ...good, completed: false, elapsedMs: 2000 };
  expect(mergeProgress(undefined, advanced)).toEqual(advanced);
  expect(mergeProgress(advanced, { ...good, elapsedMs: 1000 })).toBeNull();
  expect(
    mergeProgress(advanced, {
      ...advanced,
      typed: "hell",
      totalTypedChars: 4,
    }),
  ).toBeNull();
  const corrected = { ...advanced, typed: "hell", elapsedMs: 2100 };
  expect(mergeProgress(advanced, corrected)).toEqual(corrected);
  const completed = { ...corrected, completed: true };
  expect(mergeProgress(corrected, completed)).toEqual(completed);
  expect(mergeProgress(completed, advanced)).toBeNull();
});

test("computes ranking from input instead of a supplied WPM", () => {
  const ranked = rankProgress(
    [
      { ...good, playerId: "slower", elapsedMs: 2000 },
      { ...good, playerId: "faster", elapsedMs: 1000 },
    ],
    sentence,
  );
  expect(ranked.map((row) => row.playerId)).toEqual(["faster", "slower"]);
  expect(ranked[0]!.metrics.wpm).toBe(60);
});
