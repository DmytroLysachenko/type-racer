import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Small no-store clock sample used to align room boundaries across devices. */
export function GET() {
  return NextResponse.json(
    { now: Date.now() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
