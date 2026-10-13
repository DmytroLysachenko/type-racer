import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher.server";
import { getCurrentRound } from "@/lib/game/rounds";
import { readGuestSession } from "@/lib/guest-session";
import { readLimitedText } from "@/lib/http/read-limited-text";

export async function POST(req: NextRequest) {
  const server = getPusherServer();
  if (!server)
    return NextResponse.json(
      { error: "Live room unavailable" },
      { status: 503 },
    );
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (
    !(req.headers.get("content-type") ?? "").includes(
      "application/x-www-form-urlencoded",
    )
  )
    return NextResponse.json({ error: "Expected form data" }, { status: 400 });
  const raw = await readLimitedText(req, 512);
  if (raw === null)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const body = new URLSearchParams(raw);
  const socketId = body.get("socket_id");
  const channelName = body.get("channel_name");
  const guest = readGuestSession(req);
  const round =
    typeof channelName === "string"
      ? /^presence-round-(\d+)$/.exec(channelName)
      : null;
  const roundId = round ? Number(round[1]) : NaN;
  const currentRound = getCurrentRound().id;
  if (
    typeof socketId !== "string" ||
    body.getAll("socket_id").length !== 1 ||
    body.getAll("channel_name").length !== 1 ||
    !/^\d+\.\d+$/.test(socketId) ||
    !Number.isSafeInteger(roundId) ||
    roundId < currentRound - 2 ||
    roundId > currentRound + 1 ||
    !guest
  ) {
    return NextResponse.json(
      { error: "Invalid authorization request" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      server.authorizeChannel(socketId, channelName as string, {
        user_id: guest!.id,
        user_info: { name: guest!.name },
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Live room unavailable" },
      { status: 503 },
    );
  }
}
