import {
  DEFAULT_PRACTICE_MODE,
  parsePracticeMode,
  practiceChunks,
  practiceDurationMs,
  practiceText,
  validCustomText,
} from "@/lib/game/practice";
import { PASSAGES, PASSAGE_VERSION } from "@/lib/content/passages";
import { createRace, inputRace, tickRace } from "@/lib/game/session";

test("practice links accept only supported modes", () => {
  expect(parsePracticeMode({ mode: "timed", value: "120" })).toEqual({
    kind: "timed",
    seconds: 120,
  });
  expect(parsePracticeMode({ mode: "words", value: "50" })).toEqual({
    kind: "words",
    count: 50,
  });
  expect(parsePracticeMode({ mode: "timed", value: "500" })).toEqual(
    DEFAULT_PRACTICE_MODE,
  );
  expect(parsePracticeMode({ mode: "polish" })).toEqual({ kind: "polish" });
  expect(parsePracticeMode({ mode: "custom" })).toEqual({ kind: "custom" });
  expect(parsePracticeMode({ mode: "unknown" })).toEqual(DEFAULT_PRACTICE_MODE);
});

test("focused material and custom text stay separate from shared passages", () => {
  expect(practiceText({ kind: "quote" }, 0)).toContain("quiet start");
  expect(practiceText({ kind: "numbers" }, 0)).toMatch(/\d/);
  expect(practiceText({ kind: "punctuation" }, 0)).toContain('"');
  expect(practiceText({ kind: "polish" }, 2)).toContain("Żółty");
  expect(practiceText({ kind: "easy" }, 0)).not.toBe(
    practiceText({ kind: "challenge" }, 0),
  );
  expect(practiceText({ kind: "custom" }, 0, "  one\n two   three  ")).toBe(
    "one two three",
  );
  expect(validCustomText("short")).toBe(false);
  expect(validCustomText("Ćwiczę dziś spokojnie.")).toBe(true);
  expect(validCustomText("a".repeat(1501))).toBe(false);
});

test("original passages cover every practice length", () => {
  expect(PASSAGE_VERSION).toBe("v2");
  expect(new Set(PASSAGES).size).toBe(PASSAGES.length);
  const timed = practiceText({ kind: "timed", seconds: 120 }, 3);
  expect(timed.length).toBeGreaterThan(1800);
  const words = practiceText({ kind: "words", count: 100 }, 3);
  expect(words.split(/\s+/)).toHaveLength(100);
  expect(practiceText({ kind: "words", count: 25 }, 0)).not.toBe(
    practiceText({ kind: "words", count: 25 }, 1),
  );
  const characters = Array.from(timed);
  const chunks = practiceChunks(timed);
  expect(chunks.every((chunk) => chunk.end - chunk.start <= 80)).toBe(true);
  expect(
    chunks
      .map((chunk) => characters.slice(chunk.start, chunk.end).join(""))
      .join(""),
  ).toBe(timed);
  expect(
    chunks.slice(0, -1).every((chunk) => characters[chunk.end - 1] === " "),
  ).toBe(true);
});

test("timed practice starts on input and ends at its chosen duration", () => {
  const mode = { kind: "timed", seconds: 15 } as const;
  const target = practiceText(mode, 0);
  const started = inputRace(
    createRace(),
    target,
    "x",
    100,
    practiceDurationMs(mode),
  );
  expect(started.phase).toBe("running");
  expect(
    tickRace(started, target, 15_099, practiceDurationMs(mode)).phase,
  ).toBe("running");
  const finished = tickRace(started, target, 15_100, practiceDurationMs(mode));
  expect(finished.phase).toBe("completed");
  expect(finished.result?.elapsedMs).toBe(15_000);
});

test("word practice ends on the last character without a time limit", () => {
  const mode = { kind: "words", count: 25 } as const;
  const target = practiceText(mode, 0);
  let state = createRace();
  for (const character of Array.from(target)) {
    state = inputRace(
      state,
      target,
      state.typed + character,
      100 + state.totalTypedChars * 100,
      practiceDurationMs(mode),
    );
  }
  expect(state.phase).toBe("completed");
  expect(state.result?.accuracy).toBe(1);
});
