import { act, renderHook } from "@testing-library/react";
import { useTypingProgress } from "@/lib/hooks/useTypingProgress";
import { sendProgress } from "@/lib/pusher.client";

jest.mock("@/lib/pusher.client", () => ({ sendProgress: jest.fn() }));

test("broadcasts the first input immediately, then throttles and sends completion", () => {
  const send = jest.mocked(sendProgress);
  send.mockClear();
  let now = 100;
  const clock = jest.spyOn(performance, "now").mockImplementation(() => now);
  const props: Parameters<typeof useTypingProgress>[0] = {
    playerId: "player",
    name: "Racer",
    sentence: "hello world",
    roundId: 1,
    phase: "racing",
    remainingMs: 20_000,
  };
  try {
    const { result, rerender } = renderHook(
      (settings: Parameters<typeof useTypingProgress>[0]) =>
        useTypingProgress(settings),
      {
        initialProps: props,
      },
    );
    act(() => result.current.setTyped("h"));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1].typed).toBe("h");

    now = 600;
    act(() => result.current.setTyped("he"));
    expect(send).toHaveBeenCalledTimes(1);

    now = 1100;
    act(() => result.current.setTyped("hel"));
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1]?.[1].typed).toBe("hel");

    now = 1200;
    rerender({ ...props, phase: "results" });
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[2]?.[1].completed).toBe(true);
  } finally {
    clock.mockRestore();
  }
});
