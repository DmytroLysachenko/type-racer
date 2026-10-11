import { createRace, inputRace, tickRace } from "@/lib/game/session";

describe("race lifecycle and input", () => {
  test("starts on first character and finishes on exact text", () => {
    const start = createRace();
    expect(start.phase).toBe("ready");
    const first = inputRace(start, "ab", "a", 100);
    expect(first.phase).toBe("running");
    expect(first.startedAtMs).toBe(100);
    const done = inputRace(first, "ab", "ab", 1100);
    expect(done.phase).toBe("completed");
    expect(done.result?.wpm).toBeCloseTo(24);
    expect(inputRace(done, "ab", "a", 1200)).toBe(done);
  });
  test("rejects paste, insertion in the middle, and overlong text", () => {
    const first = inputRace(createRace(), "abc", "a", 1);
    for (const invalid of ["abc", "za", "axyz"]) {
      const after = inputRace(first, "abc", invalid, 2);
      expect(after.typed).toBe(first.typed);
      expect(after.totalTypedChars).toBe(first.totalTypedChars);
    }
  });
  test("counts repeated mistakes and corrected errors", () => {
    let race = inputRace(createRace(), "ab", "x", 100);
    race = inputRace(race, "ab", "", 200);
    race = inputRace(race, "ab", "x", 300);
    race = inputRace(race, "ab", "", 400);
    race = inputRace(race, "ab", "a", 500);
    expect(race.mistakes).toBe(2);
    expect(race.totalTypedChars).toBe(3);
    const finished = tickRace(race, "ab", 20_100);
    expect(finished.phase).toBe("completed");
    expect(finished.result?.correctedErrors).toBe(2);
    expect(finished.result?.uncorrectedErrors).toBe(0);
  });
  test("deadline uses elapsed time despite missed timer ticks", () => {
    const race = inputRace(createRace(), "abc", "a", 500);
    expect(tickRace(race, "abc", 10_000).phase).toBe("running");
    const finished = tickRace(race, "abc", 40_000);
    expect(finished.elapsedMs).toBe(20_000);
    expect(finished.result?.elapsedMs).toBe(20_000);
  });
  test("restart returns a fresh ready race", () => {
    const race = inputRace(createRace(), "abc", "x", 100);
    expect(race.phase).toBe("running");
    expect(createRace()).toEqual({
      phase: "ready",
      typed: "",
      startedAtMs: null,
      elapsedMs: 0,
      totalTypedChars: 0,
      mistakes: 0,
      result: null,
    });
  });
});
