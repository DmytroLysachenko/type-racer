"use client";

import Pusher, { Channel } from "pusher-js";

export type ProgressPayload = {
  playerId: string;
  name: string;
  roundId: number;
  typed: string;
  wpm: number;
  accuracy: number;
  hello?: boolean;
};

let client: Pusher | null = null;

const channels = new Map<string, Channel>();
const ready = new Set<string>();
const pendingLast = new Map<string, ProgressPayload>();

function chanName(roundId: number) {
  return `presence-round-${roundId}`;
}

function getIdentity() {
  try {
    const player = JSON.parse(
      localStorage.getItem("typearena-player") || "null"
    );

    return { id: player?.id ?? "anon", name: player?.name ?? "Guest" };
  } catch {
    return { id: "anon", name: "Guest" };
  }
}

export function getPusherClient() {
  if (client) return client;

  const me = getIdentity();
  client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    channelAuthorization: {
      endpoint: `/api/pusher/auth?user_id=${encodeURIComponent(
        me.id
      )}&name=${encodeURIComponent(me.name)}`,
      transport: "ajax",
    },
    forceTLS: true,
  });

  // Reconnect on local name change so presence identity refreshes
  window.addEventListener("typearena:player-updated", () => {
    try {
      client?.disconnect();
    } catch (err) {
      console.error(err);
    }
    client = null;
    channels.clear();
    ready.clear();
    pendingLast.clear();
    getPusherClient();
  });

  return client;
}

export function getRoundPresence(roundId: number) {
  const name = chanName(roundId);
  if (channels.has(name)) return channels.get(name)!;

  const ch = getPusherClient().subscribe(name);
  channels.set(name, ch);

  ch.bind("pusher:subscription_succeeded", (members: any) => {
    ready.add(name);

    const buffered = pendingLast.get(name);
    if (buffered) {
      try {
        ch.trigger("client-progress", buffered);
      } finally {
        pendingLast.delete(name);
      }
    }
  });

  return ch;
}

export function sendProgress(roundId: number, payload: ProgressPayload) {
  const name = chanName(roundId);
  const ch = getRoundPresence(roundId);
  if (!ready.has(name)) {
    pendingLast.set(name, payload);

    return;
  }
  ch.trigger("client-progress", payload);
}
