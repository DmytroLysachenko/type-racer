import type { NextRequest } from "next/server";

/** Match the browser's Origin to the public request origin, including behind a TLS proxy. */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === request.nextUrl.origin) return true;

  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto");
  if (!host || !protocol || !/^(http|https)$/.test(protocol)) return false;
  try {
    const publicUrl = new URL(`${protocol}://${host}`);
    return (
      publicUrl.host.toLowerCase() === host.toLowerCase() &&
      origin === publicUrl.origin
    );
  } catch {
    return false;
  }
}
