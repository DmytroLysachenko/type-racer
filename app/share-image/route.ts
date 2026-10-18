import { NextRequest, NextResponse } from "next/server";
import { createOgCard } from "@/lib/og-card";

export function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");
  if (
    request.nextUrl.searchParams.size !== 1 ||
    (view !== "race" && view !== "practice")
  )
    return new NextResponse(null, { status: 404 });
  return createOgCard(view);
}
