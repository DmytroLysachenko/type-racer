import { NextResponse } from "next/server";

import { CHANNEL, EVENT_FINISH } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher.server";
import { finishRound } from "@/lib/store";

export async function POST(req: Request) {
  const { playerId, roundId, wpm, accuracy } = (await req.json()) as {
    playerId: string;
    roundId: number;
    wpm: number;
    accuracy: number;
  };

  if (!playerId || typeof roundId !== "number")
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });

  finishRound(playerId, roundId, wpm);

  await pusherServer.trigger(CHANNEL, EVENT_FINISH, {
    playerId,
    roundId,
    wpm,
    accuracy,
  });
  return NextResponse.json({ ok: true });
}
