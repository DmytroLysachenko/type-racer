import { NextRequest, NextResponse } from "next/server";

import { pusherServer } from "@/lib/pusher.server";

export async function POST(req: NextRequest) {
  // Pusher sends socket_id & channel_name in the POST body (form-encoded)
  const body = await req.formData();

  const socket_id = body.get("socket_id");
  const channel_name = body.get("channel_name");

  if (!socket_id || !channel_name) {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 }
    );
  }

  // We pass identity via query string from the client (reliable across pusher-js versions)
  const { searchParams } = new URL(req.url);

  const user_id = (searchParams.get("user_id") || "anon").toString();
  const name = (searchParams.get("name") || "Guest").toString();

  const auth = pusherServer.authorizeChannel(
    socket_id.toString(),
    channel_name.toString(),
    {
      user_id,
      user_info: { name },
    }
  );

  return NextResponse.json(auth);
}
