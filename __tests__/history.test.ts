import {
  clearHistory,
  exportHistory,
  readHistory,
  saveRace,
} from "@/lib/game/history";
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
    mode: { kind: "shared" },
    contentVersion: "v2",
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
      mode: { kind: "shared" },
      contentVersion: "v2",
    });
  expect(readHistory()).toHaveLength(50);
  expect(readHistory()[0]!.id).toBe("52");
});

test("malformed saved metrics cannot reach the results view", () => {
  localStorage.setItem(
    "typearena-history-v1",
    JSON.stringify([
      {
        id: "bad",
        finishedAt: 123,
        sentence: "abc",
        metrics: { wpm: 75 },
      },
    ]),
  );
  expect(readHistory()).toEqual([]);
});

test("stored results with an invalid calendar date are ignored", () => {
  localStorage.setItem(
    "typearena-history-v2",
    JSON.stringify({
      version: 2,
      records: [
        {
          id: "bad-date",
          finishedAt: 9e15,
          sentence: "abc",
          metrics: computeMetrics("abc", "abc", 1000),
          mode: { kind: "shared" },
          contentVersion: "v2",
        },
      ],
    }),
  );
  expect(readHistory()).toEqual([]);
});

test("legacy results remain readable and migrate on the next save", () => {
  const legacy = {
    id: "older",
    finishedAt: 100,
    sentence: "abc",
    metrics: computeMetrics("abc", "abc", 1000),
  };
  localStorage.setItem("typearena-history-v1", JSON.stringify([legacy]));
  expect(readHistory()[0]).toMatchObject({
    id: "older",
    mode: { kind: "shared" },
    contentVersion: "v1",
  });
  saveRace({
    ...legacy,
    id: "new",
    mode: { kind: "shared" },
    contentVersion: "v2",
  });
  expect(readHistory().map((item) => item.id)).toEqual(["new", "older"]);
});

test("damaged version 2 storage does not hide valid legacy results", () => {
  localStorage.setItem("typearena-history-v2", "not json");
  localStorage.setItem(
    "typearena-history-v1",
    JSON.stringify([
      {
        id: "older",
        finishedAt: 100,
        sentence: "abc",
        metrics: computeMetrics("abc", "abc", 1000),
      },
    ]),
  );
  expect(readHistory().map((item) => item.id)).toEqual(["older"]);
});

test("storage refusal is reported without interrupting a result", () => {
  const notice = jest.fn();
  window.addEventListener("typearena:storage-failed", notice);
  const write = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage blocked");
    });
  try {
    expect(
      saveRace({
        id: "unsaved",
        finishedAt: 123,
        sentence: "abc",
        metrics: computeMetrics("abc", "abc", 1000),
        mode: { kind: "shared" },
        contentVersion: "v2",
      }),
    ).toBe(false);
    expect(notice).toHaveBeenCalledTimes(1);
  } finally {
    write.mockRestore();
    window.removeEventListener("typearena:storage-failed", notice);
  }
});

test("export includes validated records and deletion removes both storage versions", () => {
  localStorage.setItem(
    "typearena-history-v1",
    JSON.stringify([
      {
        id: "older",
        finishedAt: 100,
        sentence: "abc",
        metrics: computeMetrics("abc", "abc", 1000),
      },
    ]),
  );
  expect(JSON.parse(exportHistory()).records[0].id).toBe("older");
  expect(clearHistory()).toBe(true);
  expect(readHistory()).toEqual([]);
  expect(localStorage.getItem("typearena-history-v1")).toBeNull();
  expect(localStorage.getItem("typearena-history-v2")).toBeNull();
});

test("new focused practice mode remains valid in device history", () => {
  saveRace({
    id: "polish-1",
    finishedAt: 200,
    sentence: "Żółty tramwaj",
    metrics: computeMetrics("Żółty tramwaj", "Żółty", 1000),
    mode: { kind: "polish" },
    contentVersion: "v1",
  });
  expect(readHistory()[0]?.mode).toEqual({ kind: "polish" });
});

test("corrupt per-character error counts cannot enter history", () => {
  localStorage.setItem(
    "typearena-history-v2",
    JSON.stringify({
      version: 2,
      records: [
        {
          id: "bad-errors",
          finishedAt: 200,
          sentence: "abc",
          metrics: computeMetrics("abc", "abc", 1000),
          mistypedTargets: { a: 999 },
          mode: { kind: "shared" },
          contentVersion: "v2",
        },
      ],
    }),
  );
  expect(readHistory()).toEqual([]);
});
