import {
  readPracticePreference,
  savePracticePreference,
} from "@/lib/game/practice-preferences";
import { DEFAULT_PRACTICE_MODE } from "@/lib/game/practice";

beforeEach(() => localStorage.clear());

test("last practice mode survives reload and invalid data falls back safely", () => {
  expect(readPracticePreference()).toEqual(DEFAULT_PRACTICE_MODE);
  expect(savePracticePreference({ kind: "words", count: 50 })).toBe(true);
  expect(readPracticePreference()).toEqual({ kind: "words", count: 50 });
  localStorage.setItem(
    "typearena-practice-mode-v1",
    JSON.stringify({ kind: "timed", seconds: 900 }),
  );
  expect(readPracticePreference()).toEqual(DEFAULT_PRACTICE_MODE);
  localStorage.setItem("typearena-practice-mode-v1", "not-json");
  expect(readPracticePreference()).toEqual(DEFAULT_PRACTICE_MODE);
});
