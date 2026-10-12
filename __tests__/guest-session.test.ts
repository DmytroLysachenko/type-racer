/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/guest/route";
import {
  GUEST_COOKIE,
  issueGuestSession,
  readGuestSession,
} from "@/lib/guest-session";

const previous = process.env.SESSION_SECRET;
beforeAll(() => {
  process.env.SESSION_SECRET = "test-only-signing-key";
});
afterAll(() => {
  if (previous === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previous;
});

test("signed guest identity survives name changes and rejects tampering", () => {
  const first = issueGuestSession("Alice");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `${GUEST_COOKIE}=${first.cookie!.value}` },
  });
  expect(readGuestSession(request)).toEqual(first.session);
  const updated = issueGuestSession("New name", readGuestSession(request));
  expect(updated.session.id).toBe(first.session.id);
  const tampered = new NextRequest("http://localhost/", {
    headers: { cookie: `${GUEST_COOKIE}=${first.cookie!.value}x` },
  });
  expect(readGuestSession(tampered)).toBeNull();
});

test("guest cookies expire even if a client replays an old cookie", () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  try {
    const issued = issueGuestSession("Alice");
    const request = new NextRequest("http://localhost/", {
      headers: { cookie: `${GUEST_COOKIE}=${issued.cookie!.value}` },
    });
    clock.mockReturnValue(now + 31 * 24 * 60 * 60 * 1000);
    expect(readGuestSession(request)).toBeNull();
  } finally {
    clock.mockRestore();
  }
});

test("guest route validates origin and name before issuing an HttpOnly cookie", async () => {
  const wrongOrigin = new NextRequest("http://localhost/api/guest", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
    body: JSON.stringify({ name: "Alice" }),
  });
  expect((await POST(wrongOrigin)).status).toBe(403);
  const invalid = new NextRequest("http://localhost/api/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: " " }),
  });
  expect((await POST(invalid)).status).toBe(400);
  const valid = new NextRequest("http://localhost/api/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Alice" }),
  });
  const response = await POST(valid);
  expect(response.status).toBe(200);
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect((await response.json()).name).toBe("Alice");
});

test("guest route rejects oversized and non-JSON requests", async () => {
  const oversized = new NextRequest("http://localhost/api/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x".repeat(600) }),
  });
  expect((await POST(oversized)).status).toBe(413);
  const text = new NextRequest("http://localhost/api/guest", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "Alice",
  });
  expect((await POST(text)).status).toBe(415);
});
