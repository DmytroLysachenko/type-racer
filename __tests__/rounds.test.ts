import { getCurrentRound, ROUND_CYCLE_MS } from "@/lib/game/rounds";

test("every visitor moves through lobby, race and results on the same server timeline", () => {
  const base = ROUND_CYCLE_MS * 10;
  const lobby = getCurrentRound(base);
  expect(lobby.phase).toBe("lobby");
  expect(lobby.phaseEndsAt - base).toBe(5000);
  const racing = getCurrentRound(lobby.startsAt);
  expect(racing.phase).toBe("racing");
  expect(racing.id).toBe(lobby.id);
  expect(racing.sentence).toBe(lobby.sentence);
  expect(racing.endsAt - racing.startsAt).toBe(20000);
  const results = getCurrentRound(racing.endsAt);
  expect(results.phase).toBe("results");
  expect(results.id).toBe(lobby.id);
  expect(getCurrentRound(results.resultsEndAt).id).toBe(lobby.id + 1);
  expect(getCurrentRound(results.resultsEndAt).phase).toBe("lobby");
});
