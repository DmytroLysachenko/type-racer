"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeMetrics, type Metrics } from "@/lib/game/metrics";
import { saveRace } from "@/lib/game/history";
import {
  createRace,
  finishRace,
  inputRace,
  tickRace,
} from "@/lib/game/session";
import { sendProgress } from "@/lib/pusher.client";
import type { ProgressPayload } from "@/lib/game/progress";
import type { RoundPhase } from "@/lib/game/rounds";

export function useTypingProgress({
  playerId,
  name,
  sentence,
  roundId,
  phase,
  remainingMs,
}: {
  playerId: string;
  name: string;
  sentence: string;
  roundId: number;
  phase: RoundPhase;
  remainingMs: number;
}) {
  const [race, setRace] = useState(createRace);
  const raceRef = useRef(race);
  useEffect(() => {
    raceRef.current = race;
  }, [race]);
  const durationRef = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const savedResult = useRef(false);

  const saveResult = useCallback(
    (result: Metrics) => {
      if (savedResult.current) return;
      savedResult.current = true;
      saveRace({
        id: crypto.randomUUID(),
        finishedAt: Date.now(),
        sentence,
        metrics: result,
      });
    },
    [sentence],
  );

  const setTyped = useCallback(
    (proposed: string) => {
      if (phase !== "racing" || remainingMs <= 0) return;
      if (durationRef.current === null) {
        // Only a valid first character can start this player's elapsed time.
        if (Array.from(proposed).length !== 1) return;
        durationRef.current = remainingMs;
      }
      setRace((previous) =>
        inputRace(
          previous,
          sentence,
          proposed,
          performance.now(),
          durationRef.current!,
        ),
      );
    },
    [phase, remainingMs, sentence],
  );

  useEffect(() => {
    if (phase === "results") {
      setRace((previous) =>
        finishRace(previous, sentence, durationRef.current ?? 0),
      );
    }
  }, [phase, sentence]);

  useEffect(() => {
    if (race.phase !== "running") return;
    const update = () =>
      setRace((previous) =>
        tickRace(
          previous,
          sentence,
          performance.now(),
          durationRef.current ?? 0,
        ),
      );
    const timer = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [race.phase, sentence]);

  const metrics =
    race.result ?? computeMetrics(sentence, race.typed, race.elapsedMs, race);
  const progress: ProgressPayload = useMemo(
    () => ({
      playerId,
      name,
      roundId,
      typed: race.typed,
      totalTypedChars: race.totalTypedChars,
      mistakes: race.mistakes,
      elapsedMs: metrics.elapsedMs,
      completed: race.phase === "completed",
    }),
    [
      playerId,
      name,
      roundId,
      race.typed,
      race.totalTypedChars,
      race.mistakes,
      race.phase,
      metrics.elapsedMs,
    ],
  );
  useEffect(() => {
    if (race.phase === "ready" || document.visibilityState === "hidden") return;
    const now = performance.now();
    if (race.phase === "running" && now - lastSentAt.current < 2000) return;
    lastSentAt.current = now;
    sendProgress(roundId, progress);
  }, [race.phase, roundId, progress]);

  useEffect(() => {
    if (race.phase !== "completed" || !race.result || savedResult.current)
      return;
    saveResult(race.result);
  }, [race.phase, race.result, saveResult]);

  // The page changes rooms at the boundary. Save an unfinished attempt before
  // the old round unmounts, even when the timer callback has not run yet.
  useEffect(
    () => () => {
      const last = raceRef.current;
      if (
        last.phase === "running" &&
        last.startedAtMs !== null &&
        performance.now() - last.startedAtMs >=
          (durationRef.current ?? Infinity)
      ) {
        const ended = tickRace(
          last,
          sentence,
          performance.now(),
          durationRef.current ?? 0,
        );
        saveResult(
          ended.result ?? finishRace(last, sentence, last.elapsedMs).result!,
        );
      }
    },
    [sentence, saveResult],
  );

  return { race, typed: race.typed, setTyped, metrics, progress };
}
