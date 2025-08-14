import { render, screen, act } from "@testing-library/react";
import React from "react";

// --- Mocks ---
jest.mock("@/lib/hooks/useRound", () => ({
  useRound: () => ({ round: { id: 1 } }),
}));

// We'll capture the handlers passed to bindRound so tests can trigger them.
let lastHandlers: any = null;
jest.mock("@/lib/pusher.client", () => ({
  bindRound: (roundId: number, handlers: any) => {
    lastHandlers = handlers;
    // return off() cleanup
    return () => {
      lastHandlers = null;
    };
  },
}));

// import *after* mocks
import { ScoreTable } from "@/components/ScoreTable";

function seedMembers(...members: Array<{ id: string; name?: string }>) {
  const fakeMembers = {
    each: (fn: (m: any) => void) =>
      members.forEach((m) =>
        fn({ id: m.id, info: { name: m.name ?? "Guest" } })
      ),
  };
  act(() => lastHandlers.onSubscriptionSucceeded(fakeMembers));
}

function sendProgress(d: any) {
  act(() => lastHandlers.onProgress(d));
}

describe("<ScoreTable />", () => {
  test("renders empty state initially", () => {
    render(<ScoreTable selfId="p1" />);
    expect(screen.getByText(/No players yet/i)).toBeInTheDocument();
  });

  test("seeds rows on subscription succeeded", () => {
    render(<ScoreTable selfId="p1" />);
    seedMembers({ id: "p1", name: "Alice" }, { id: "p2", name: "Bob" });

    expect(screen.getByText("Alice (you)")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("updates a row on progress and formats wpm/accuracy", () => {
    render(<ScoreTable selfId="p1" />);
    seedMembers({ id: "p1", name: "Alice" });

    sendProgress({
      roundId: 1,
      playerId: "p1",
      name: "Alice",
      typed: "hello",
      wpm: 73.6,
      accuracy: 0.923,
    });

    // typed column
    expect(screen.getByText("hello")).toBeInTheDocument();
    // wpm rounded
    expect(screen.getByText("74")).toBeInTheDocument();
    // accuracy percent (0.923 -> 92%)
    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  test("local echo event updates instantly", () => {
    render(<ScoreTable selfId="me" />);
    seedMembers({ id: "me", name: "Me" });

    const detail = {
      roundId: 1,
      playerId: "me",
      name: "Me",
      typed: "local",
      wpm: 50,
      accuracy: 0.8,
    };

    act(() => {
      window.dispatchEvent(
        new CustomEvent("typearena:local-progress", { detail })
      );
    });

    expect(screen.getByText("local")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  test("member added / removed adjusts rows", () => {
    render(<ScoreTable />);
    seedMembers({ id: "p1", name: "Alice" });

    act(() => lastHandlers.onMemberAdded({ id: "p2", info: { name: "Bob" } }));
    expect(screen.getByText("Bob")).toBeInTheDocument();

    act(() => lastHandlers.onMemberRemoved({ id: "p1" }));
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });
});
