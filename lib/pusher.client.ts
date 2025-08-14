"use client";

import Pusher from "pusher-js";

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  // Pusher JS will POST {socket_id, channel_name} here for private/presence subscriptions:
  channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
});
