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
    const p = JSON.parse(localStorage.getItem("typearena-player") || "null");
    return { id: p?.id ?? "anon", name: p?.name ?? "Guest" };
  } catch {
    return { id: "anon", name: "Guest" };
  }
}

function getPusherClient() {
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
  window.addEventListener("typearena:player-updated", (e: any) => {
    try {
      client?.disconnect();
    } catch {}
    client = null;
    channels.clear();
    ready.clear();
    pendingLast.clear();
    getPusherClient();
  });

  return client;
}

function getRoundPresence(roundId: number) {
  const name = chanName(roundId);
  if (channels.has(name)) return channels.get(name)!;

  const channel = getPusherClient().subscribe(name);
  channels.set(name, channel);

  channel.bind("pusher:subscription_succeeded", (members: any) => {
    ready.add(name);

    const buffered = pendingLast.get(name);
    if (buffered) {
      try {
        channel.trigger("client-progress", buffered);
      } finally {
        pendingLast.delete(name);
      }
    }
  });

  return channel;
}

export function bindRound(
  roundId: number,
  handlers: {
    onSubscriptionSucceeded?: (members: any) => void;
    onMemberAdded?: (member: any) => void;
    onMemberRemoved?: (member: any) => void;
    onProgress?: (payload: ProgressPayload) => void;
  }
) {
  const channel = getRoundPresence(roundId);

  const unsubs: Array<() => void> = [];

  const add = (event: string, fn: (...a: any[]) => void) => {
    channel.bind(event, fn as any);
    unsubs.push(() => channel.unbind(event, fn as any));
  };

  if (handlers.onSubscriptionSucceeded)
    add("pusher:subscription_succeeded", handlers.onSubscriptionSucceeded);

  if (handlers.onMemberAdded)
    add("pusher:member_added", handlers.onMemberAdded);

  if (handlers.onMemberRemoved)
    add("pusher:member_removed", handlers.onMemberRemoved);

  if (handlers.onProgress)
    add("client-progress", (d: any) => {
      handlers.onProgress!(d);
    });

  return () => unsubs.forEach((u) => u());
}

export function sendProgress(roundId: number, payload: ProgressPayload) {
  const name = chanName(roundId);
  const channel = getRoundPresence(roundId);
  if (!ready.has(name)) {
    pendingLast.set(name, payload);

    return;
  }
  channel.trigger("client-progress", payload);
}
