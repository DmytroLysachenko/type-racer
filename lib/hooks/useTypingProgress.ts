// useTypingProgress.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeMetrics } from "@/lib/utils/metrics";

import { sendProgress } from "../pusher.client";

type UseTypingProgressArgs = {
  playerId: string;
  name: string;
  sentence: string;
  roundId: number;
};

export function useTypingProgress({
  playerId,
  name,
  sentence,
  roundId,
}: UseTypingProgressArgs) {
  const [typed, setTyped] = useState("");

  // ---- refs (kept small)
  const startedAtRef = useRef<number>(Date.now());
  const finishPostedRef = useRef(false);
  const trailTimeoutRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  // bundle "last sent" markers
  const lastSentRef = useRef<{ len: number; acc: number; ms: number }>({
    len: 0,
    acc: 1,
    ms: 0,
  });

  // expose latest typed to timers without re-subscribing
  const typedRef = useRef(typed);
  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  // compute metrics for the current UI frame
  const metrics = useMemo(() => {
    const elapsedMs = Math.max(1, Date.now() - startedAtRef.current);
    return computeMetrics(sentence, typed, elapsedMs);
  }, [sentence, typed]);

  //  reset state when new round or new sentence
  useEffect(() => {
    setTyped("");
    typedRef.current = "";
    startedAtRef.current = Date.now();
    finishPostedRef.current = false;
    lastSentRef.current = { len: 0, acc: 1, ms: 0 };

    if (trailTimeoutRef.current) clearTimeout(trailTimeoutRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  }, [roundId, sentence]);

  // ---- hello on round join
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
