import { upsertPlayer } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, name } = (await req.json()) as { id: string; name: string };

  if (!id || !name)
    return NextResponse.json({ error: "Missing id/name" }, { status: 400 });

  const player = upsertPlayer(id, name);
  return NextResponse.json(player);
}
