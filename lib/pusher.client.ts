"use client";

import Pusher, { type Channel } from "pusher-js";
import type { ProgressPayload } from "@/lib/game/progress";
import { roundChannel } from "@/lib/game/rounds";

export type { ProgressPayload } from "@/lib/game/progress";
export type Member = { id: string; info?: { name?: string } };
export type Members = { each: (callback: (member: Member) => void) => void };
type Handlers = {
  onSubscriptionSucceeded?: (members: Members) => void;
  onMemberAdded?: (member: Member) => void;
  onMemberRemoved?: (member: Member) => void;
  onProgress?: (payload: ProgressPayload, senderId: string) => void;
  onStatus?: (status: string) => void;
};

export const liveConfigured = Boolean(
  process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
);
let client: Pusher | null = null;
const subscriptions = new Map<number, Channel>();
const ready = new Set<number>();
const pending = new Map<number, ProgressPayload>();
const latest = new Map<number, ProgressPayload>();
const lastSnapshotSent = new Map<number, number>();

function getClient(): Pusher | null {
  if (!liveConfigured) return null;
  if (client) return client;
  client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
  });
  return client;
}

function getChannel(roundId: number): Channel | null {
  const existing = subscriptions.get(roundId);
  if (existing) return existing;
  const pusher = getClient();
  if (!pusher) return null;
  const channel = pusher.subscribe(roundChannel(roundId));
  subscriptions.set(roundId, channel);
  channel.bind("pusher:subscription_succeeded", () => {
    ready.add(roundId);
    const buffered = pending.get(roundId);
    if (buffered) {
      pending.delete(roundId);
      sendProgress(roundId, buffered);
    } else if (latest.has(roundId)) sendProgress(roundId, latest.get(roundId)!);
    channel.trigger("client-state-request", { roundId });
  });
  channel.bind("client-state-request", () => {
    const snapshot = latest.get(roundId);
    const now = performance.now();
    if (
      snapshot &&
      now - (lastSnapshotSent.get(roundId) ?? -Infinity) >= 1000
    ) {
      lastSnapshotSent.set(roundId, now);
      sendProgress(roundId, snapshot);
    }
  });
  return channel;
}

export function bindRound(roundId: number, handlers: Handlers): () => void {
  const channel = getChannel(roundId);
  if (!channel) return () => {};
  const bindings: Array<
    [string, (data: unknown, metadata?: { user_id?: string }) => void]
  > = [];
  const add = (
    event: string,
    callback: (data: unknown, metadata?: { user_id?: string }) => void,
  ) => {
    channel.bind(event, callback);
    bindings.push([event, callback]);
  };
  if (handlers.onSubscriptionSucceeded)
    add("pusher:subscription_succeeded", (data) =>
      handlers.onSubscriptionSucceeded?.(data as Members),
    );
  if (handlers.onMemberAdded)
    add("pusher:member_added", (data) =>
      handlers.onMemberAdded?.(data as Member),
    );
  if (handlers.onMemberRemoved)
    add("pusher:member_removed", (data) =>
      handlers.onMemberRemoved?.(data as Member),
    );
  if (handlers.onProgress)
    add("client-progress", (data, metadata) => {
      if (typeof metadata?.user_id === "string")
        handlers.onProgress?.(data as ProgressPayload, metadata.user_id);
    });
  if (handlers.onStatus) {
    handlers.onStatus(client?.connection.state ?? "connecting");
    const status = (state: { current: string }) => {
      if (state.current !== "connected") ready.delete(roundId);
      handlers.onStatus?.(state.current);
    };
    client?.connection.bind("state_change", status);
    bindings.push([
      "connection:state_change",
      status as (data: unknown) => void,
    ]);
    add("pusher:subscription_error", () => handlers.onStatus?.("unavailable"));
  }
  const onOffline = () => {
    ready.delete(roundId);
    handlers.onStatus?.("offline");
    client?.disconnect();
  };
  const onOnline = () => {
    handlers.onStatus?.("connecting");
    client?.connect();
  };
  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);
  if (!navigator.onLine) onOffline();
  return () => {
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
    bindings.forEach(([event, callback]) => {
      if (event === "connection:state_change")
        client?.connection.unbind("state_change", callback);
      else channel.unbind(event, callback);
    });
    channel.unbind("pusher:subscription_succeeded");
    channel.unbind("client-state-request");
    client?.unsubscribe(roundChannel(roundId));
    subscriptions.delete(roundId);
    ready.delete(roundId);
    pending.delete(roundId);
    latest.delete(roundId);
    lastSnapshotSent.delete(roundId);
  };
}

export function sendProgress(roundId: number, payload: ProgressPayload): void {
  latest.set(roundId, payload);
  const channel = getChannel(roundId);
  if (!channel) return;
  if (!ready.has(roundId)) {
    pending.set(roundId, payload);
    return;
  }
  try {
    channel.trigger("client-progress", payload);
  } catch {
    pending.set(roundId, payload);
  }
}
