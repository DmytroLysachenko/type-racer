import { NextRequest, NextResponse } from "next/server";
import { issueGuestSession, readGuestSession } from "@/lib/guest-session";
import { readLimitedText } from "@/lib/http/read-limited-text";
import { isSameOriginRequest } from "@/lib/http/same-origin";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").includes("application/json"))
    return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  const raw = await readLimitedText(req, 512);
  if (raw === null)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const proposed =
    body && typeof body === "object"
      ? (body as { name?: unknown; id?: unknown })
      : {};
  const name =
    typeof proposed.name === "string"
      ? proposed.name.trim().replace(/\s+/g, " ")
      : "";
  if (!name || name.length > 32)
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  const existing = readGuestSession(req);
  const { session, cookie } = issueGuestSession(name, existing);
  // Credential-free local practice retains its browser identity.
  if (
    !cookie &&
    typeof proposed.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(proposed.id)
  )
    session.id = proposed.id;
  const response = NextResponse.json(session, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
  if (cookie)
    response.cookies.set({
      ...cookie,
      secure:
        process.env.NODE_ENV === "production" ||
        req.nextUrl.protocol === "https:",
    });
  return response;
}
