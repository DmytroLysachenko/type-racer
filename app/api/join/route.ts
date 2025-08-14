import { NextResponse } from "next/server";

import { upsertPlayer } from "@/lib/store";

export async function POST(req: Request) {
  const ctype = req.headers.get("content-type") ?? "";

  if (!ctype.includes("application/json"))
    return NextResponse.json(
      { error: 'Expected "application/json' },
      { status: 400 }
    );

  const res = await req.json();

  const { id, name } = res as { id: string; name: string };

  if (!id || !name)
    return NextResponse.json({ error: "Missing id/name" }, { status: 400 });

  const player = upsertPlayer(id, name);
  return NextResponse.json(player);
}
