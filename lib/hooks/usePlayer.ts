"use client";

import { useEffect, useState } from "react";

export type PlayerLocal = { id: string; name: string };
const KEY = "typearena-player";
const EVENT = "typearena:player-updated";

function validPlayer(value: unknown): value is PlayerLocal {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<PlayerLocal>;
  return (
    typeof candidate.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(candidate.id) &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    candidate.name.length <= 32
  );
}
function readPlayer(): PlayerLocal {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (validPlayer(parsed)) return parsed;
  } catch {
    /* Restore a guest below. */
  }
  const player = {
    id: crypto.randomUUID(),
    name: `Guest-${Math.floor(Math.random() * 1000)}`,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    /* Storage may be disabled. */
  }
  return player;
}

function storePlayer(player: PlayerLocal) {
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    /* Storage may be disabled. */
  }
}

async function syncGuest(
  player: PlayerLocal,
  signal?: AbortSignal,
): Promise<PlayerLocal> {
  const response = await fetch("/api/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(player),
    signal,
  });
  if (!response.ok) throw new Error("Guest session unavailable");
  const result: unknown = await response.json();
  if (!validPlayer(result)) throw new Error("Invalid guest session");
  storePlayer(result);
  return result;
}

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerLocal | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const local = readPlayer();
    void syncGuest(local, controller.signal)
      .then((session) => setPlayer(session))
      .catch(() => {
        if (!controller.signal.aborted) setPlayer(local);
      });
    const update = () => setPlayer(readPlayer());
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      controller.abort();
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const updateName = async (name: string): Promise<boolean> => {
    if (!player) return false;
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean || clean.length > 32) return false;
    const next = { ...player, name: clean };
    try {
      const session = await syncGuest(next);
      setPlayer(session);
    } catch {
      return false;
    }
    window.dispatchEvent(new Event(EVENT));
    return true;
  };
  return { player, updateName };
}
