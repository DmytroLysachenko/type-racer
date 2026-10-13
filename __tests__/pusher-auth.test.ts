/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/pusher/auth/route";
import { getPusherServer } from "@/lib/pusher.server";
import { getCurrentRound } from "@/lib/game/rounds";
import { readGuestSession } from "@/lib/guest-session";

jest.mock("@/lib/pusher.server", () => ({ getPusherServer: jest.fn() }));
jest.mock("@/lib/guest-session", () => ({ readGuestSession: jest.fn() }));
const mockServer = jest.mocked(getPusherServer);
const mockGuest = jest.mocked(readGuestSession);
const id = "123e4567-e89b-42d3-a456-426614174000";
function request(channel: string, name = "Visitor") {
  const params = new URLSearchParams({ user_id: id, name });
  return new NextRequest(`http://localhost/api/pusher/auth?${params}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ socket_id: "123.456", channel_name: channel }),
  });
}
beforeEach(() => {
  mockServer.mockReset();
  mockGuest.mockReturnValue({ id, name: "Visitor" });
});
test("returns 503 when live credentials are unavailable", async () => {
  mockServer.mockReturnValue(null);
  expect((await POST(request("presence-round-1"))).status).toBe(503);
});
test("rejects arbitrary channels and invalid names", async () => {
  mockServer.mockReturnValue({
    authorizeChannel: jest.fn(),
  } as unknown as NonNullable<ReturnType<typeof getPusherServer>>);
  expect((await POST(request("private-other"))).status).toBe(400);
  mockGuest.mockReturnValue(null);
  expect(
    (await POST(request(`presence-round-${getCurrentRound().id}`, " "))).status,
  ).toBe(400);
});
test("rejects spoofed query identity without a signed guest cookie", async () => {
  mockServer.mockReturnValue({
    authorizeChannel: jest.fn(),
  } as unknown as NonNullable<ReturnType<typeof getPusherServer>>);
  mockGuest.mockReturnValue(null);
  expect(
    (await POST(request(`presence-round-${getCurrentRound().id}`))).status,
  ).toBe(400);
});
test("authorizes a valid recent presence round", async () => {
  const authorizeChannel = jest.fn().mockReturnValue({ auth: "signed" });
  mockServer.mockReturnValue({ authorizeChannel } as unknown as NonNullable<
    ReturnType<typeof getPusherServer>
  >);
  const round = `presence-round-${getCurrentRound().id}`;
  const response = await POST(request(round));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ auth: "signed" });
  expect(authorizeChannel).toHaveBeenCalledWith("123.456", round, {
    user_id: id,
    user_info: { name: "Visitor" },
  });
});

test("rejects cross-origin, duplicate and oversized authorization requests", async () => {
  mockServer.mockReturnValue({
    authorizeChannel: jest.fn(),
  } as unknown as NonNullable<ReturnType<typeof getPusherServer>>);
  const round = `presence-round-${getCurrentRound().id}`;
  const crossOrigin = new NextRequest("http://localhost/api/pusher/auth", {
    method: "POST",
    headers: {
      origin: "https://attacker.example",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ socket_id: "123.456", channel_name: round }),
  });
  expect((await POST(crossOrigin)).status).toBe(403);
  const duplicate = new NextRequest("http://localhost/api/pusher/auth", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `socket_id=123.456&socket_id=789.000&channel_name=${round}`,
  });
  expect((await POST(duplicate)).status).toBe(400);
  const oversized = new NextRequest("http://localhost/api/pusher/auth", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `socket_id=123.456&channel_name=${round}&padding=${"x".repeat(600)}`,
  });
  expect((await POST(oversized)).status).toBe(413);
});
