"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeMetrics } from "@/lib/utils/metrics";

import { HEARTBEAT_MS, MIN_SEND_MS, TRAIL_DEBOUNCE_MS } from "../constants";
import { sendProgress } from "../pusher.client";

type UseTypingProgressArgs = {
  playerId: string;
  name: string;
  sentence: string;
  roundId: number;
  secondsLeft: number;
};

export function useTypingProgress({
  playerId,
  name,
  sentence,
  roundId,
  secondsLeft,
}: UseTypingProgressArgs) {
  const [typed, setTyped] = useState("");
  const typedRef = useRef("");
  const lastProgressMsRef = useRef(0);
  const heartbeatIdRef = useRef<number | null>(null);
  const trailTimeoutIdRef = useRef<number | null>(null);
  const startedAtMsRef = useRef<number>(Date.now());
  const lastSentLengthRef = useRef(0);
  const lastSentAccuracyRef = useRef(1);
  const finishPostedRef = useRef(false);

  const metrics = useMemo(() => {
    const elapsedMs = Date.now() - startedAtMsRef.current;
    return computeMetrics(sentence, typed, Math.max(1, elapsedMs));
  }, [sentence, typed]);

  // reset when round or sentence changes
  useEffect(() => {
    setTyped("");
    typedRef.current = "";
    lastProgressMsRef.current = 0;
    startedAtMsRef.current = Date.now();
    lastSentLengthRef.current = 0;
    lastSentAccuracyRef.current = 1;
    finishPostedRef.current = false;
    if (heartbeatIdRef.current) clearInterval(heartbeatIdRef.current);
    if (trailTimeoutIdRef.current) clearTimeout(trailTimeoutIdRef.current);
  }, [roundId, sentence]);

  // keep ref in sync
  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  // local echo so UI/tables feel instant
  useEffect(() => {
    const detail = {
      playerId,
      name,
      roundId,
      typed,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
    };
    window.dispatchEvent(
      new CustomEvent("typearena:local-progress", { detail })
    );
  }, [typed, metrics.wpm, metrics.accuracy, roundId, playerId, name]);

  /** decide if change is "meaningful" enough to send */
  const hasMeaningfulDelta = useCallback(() => {
    const current = typedRef.current;
    const lenNow = current.length;
    const atWordBoundary = /\s$/.test(current);
    const accNow = computeMetrics(sentence, current, 1).accuracy;
    const lengthJump = lenNow >= lastSentLengthRef.current + 5;
    const accuracyJump = Math.abs(accNow - lastSentAccuracyRef.current) >= 0.02;
    return lengthJump || accuracyJump || atWordBoundary;
  }, [sentence]);

  /** single place that emits progress (throttled unless force=true) */
  const emitProgress = useCallback(
    (force = false) => {
      const now = Date.now();
      const tooSoon = now - lastProgressMsRef.current < MIN_SEND_MS;

      // don't emit while tab hidden unless it's a forced trailing send
      if (!force && document.visibilityState === "hidden") return;
      if (!force && (tooSoon || !hasMeaningfulDelta())) return;

      const current = typedRef.current;
      const accNow = computeMetrics(sentence, current, 1).accuracy;

      // commit last-sent markers
      lastSentLengthRef.current = current.length;
      lastSentAccuracyRef.current = accNow;
      lastProgressMsRef.current = now;

      // compact payload
      sendProgress(roundId, {
        playerId,
        name,
        roundId,
        typed: current,
        wpm: computeMetrics(
          sentence,
          current,
          Math.max(1, now - startedAtMsRef.current)
        ).wpm,
        accuracy: accNow,
      });
    },
    [hasMeaningfulDelta, name, playerId, roundId, sentence]
  );

  // trailing send + heartbeat scheduler
  useEffect(() => {
    if (trailTimeoutIdRef.current) clearTimeout(trailTimeoutIdRef.current);

    trailTimeoutIdRef.current = window.setTimeout(
      () => emitProgress(true),
      TRAIL_DEBOUNCE_MS
    );

    if (heartbeatIdRef.current) clearInterval(heartbeatIdRef.current);

    heartbeatIdRef.current = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      emitProgress(false);
    }, HEARTBEAT_MS);

    return () => {
      if (trailTimeoutIdRef.current) clearTimeout(trailTimeoutIdRef.current);
      if (heartbeatIdRef.current) clearInterval(heartbeatIdRef.current);
    };
  }, [typed, emitProgress]);

  // finalization (persist once when round ends)
  useEffect(() => {
    if (secondsLeft > 0 || finishPostedRef.current) return;

    finishPostedRef.current = true;

    fetch("/api/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        roundId,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
      }),
    }).catch((err) => {
      console.error(err);
    });
  }, [secondsLeft, playerId, roundId, metrics.wpm, metrics.accuracy]);

  // hello on round join (kept for your existing backend expectations)
  useEffect(() => {
    sendProgress(roundId, {
      playerId,
      name,
      roundId,
      typed: "",
      wpm: 0,
      accuracy: 1,
      hello: true,
    });
  }, [roundId, playerId, name]);

  return { typed, setTyped, metrics };
}
