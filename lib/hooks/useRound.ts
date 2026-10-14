"use client";

import { useEffect, useState } from "react";
import { getCurrentRound } from "@/lib/game/rounds";

type ClockState = { now: number; synced: boolean };

/** Project a server clock sample with monotonic time; resample after tab wakes. */
export function useRound() {
  const [clock, setClock] = useState<ClockState | null>(null);

  useEffect(() => {
    let active = true;
    let anchor = {
      serverNow: Date.now(),
      at: performance.now(),
      synced: false,
    };
    let controller: AbortController | null = null;
    const update = () => {
      if (!active) return;
      setClock({
        now: anchor.serverNow + performance.now() - anchor.at,
        synced: anchor.synced,
      });
    };
    const sync = async () => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      const signal = requestController.signal;
      const sentAt = performance.now();
      const timeout = window.setTimeout(() => requestController.abort(), 4_000);
      try {
        const response = await fetch("/api/time", {
          cache: "no-store",
          signal,
        });
        if (!response.ok) throw new Error("Clock unavailable");
        const data: unknown = await response.json();
        const receivedAt = performance.now();
        if (
          !data ||
          typeof data !== "object" ||
          !("now" in data) ||
          typeof data.now !== "number" ||
          !Number.isFinite(data.now)
        )
          throw new Error("Invalid clock response");
        if (!active || signal.aborted) return;
        anchor = {
          serverNow: data.now + (receivedAt - sentAt) / 2,
          at: receivedAt,
          synced: true,
        };
        update();
      } catch {
        // Keep projecting a prior server sample across temporary outages.
        if (active && controller?.signal === signal && !anchor.synced) {
          anchor = {
            serverNow: Date.now(),
            at: performance.now(),
            synced: false,
          };
          update();
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void sync();
    const tick = window.setInterval(update, 250);
    const resample = window.setInterval(() => void sync(), 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", sync);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(tick);
      window.clearInterval(resample);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", sync);
    };
  }, []);

  if (!clock) return null;
  const round = getCurrentRound(clock.now);
  return {
    round,
    now: clock.now,
    synced: clock.synced,
    secondsLeft: Math.max(0, Math.ceil((round.phaseEndsAt - clock.now) / 1000)),
  };
}
