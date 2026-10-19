import { act, render, screen, within } from "@testing-library/react";
import { ScoreTable } from "@/components/ScoreTable";
import type { Member, Members, ProgressPayload } from "@/lib/pusher.client";

let handlers: {
  onSubscriptionSucceeded?: (members: Members) => void;
  onMemberAdded?: (member: Member) => void;
  onMemberRemoved?: (member: Member) => void;
  onProgress?: (payload: ProgressPayload, senderId: string) => void;
  onStatus?: (status: string) => void;
} = {};
jest.mock("@/lib/pusher.client", () => ({
  liveConfigured: true,
  bindRound: (_roundId: number, next: typeof handlers) => {
    handlers = next;
    return () => {};
  },
}));

const sentence = "hello world";
const props = { selfId: "me", roundId: 1, sentence, phase: "racing" as const };
const progress: ProgressPayload = {
  playerId: "me",
  name: "Me",
  roundId: 1,
  typed: "hello",
  totalTypedChars: 5,
  mistakes: 0,
  elapsedMs: 1000,
  completed: false,
};
const seed = () =>
  act(() =>
    handlers.onSubscriptionSucceeded?.({
      each: (callback) =>
        [
          { id: "me", info: { name: "Me" } },
          { id: "other", info: { name: "Other" } },
        ].forEach(callback),
    }),
  );

describe("multiplayer standings", () => {
  test("shows connection and waiting states", () => {
    render(<ScoreTable {...props} />);
    expect(screen.getByTestId("room-empty")).toBeInTheDocument();
    act(() => handlers.onStatus?.("connected"));
    expect(screen.getByTestId("room-connection")).toHaveAttribute(
      "data-status",
      "connected",
    );
  });
  test("seeds presence and marks the current player", () => {
    render(<ScoreTable {...props} />);
    seed();
    expect(screen.getByRole("row", { name: /Me \(you\)/ })).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Me \(you\)/ })).getAllByRole(
        "cell",
      )[4],
    ).toHaveTextContent("—");
  });
  test("calculates scores from bounded progress and ignores invalid events", () => {
    render(<ScoreTable {...props} />);
    seed();
    act(() =>
      handlers.onProgress?.(
        { ...progress, playerId: "other", name: "Fake" },
        "other",
      ),
    );
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.queryByText("Fake")).not.toBeInTheDocument();
    expect(screen.getByText("5 chars")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    act(() => handlers.onProgress?.(progress, "other"));
    expect(screen.getByRole("row", { name: /Me \(you\)/ })).toHaveTextContent(
      "0 chars",
    );
    act(() => handlers.onProgress?.({ ...progress, roundId: 2 }, "me"));
    act(() =>
      handlers.onProgress?.({ ...progress, playerId: "stranger" }, "other"),
    );
    expect(screen.queryByText("stranger")).not.toBeInTheDocument();
  });
  test("shows results ranking and retains a departed racer's result", () => {
    const { rerender } = render(<ScoreTable {...props} />);
    seed();
    act(() =>
      handlers.onProgress?.(
        {
          ...progress,
          playerId: "other",
          name: "Other",
          elapsedMs: 2000,
          completed: true,
        },
        "other",
      ),
    );
    rerender(
      <ScoreTable {...props} phase="results" localProgress={progress} />,
    );
    expect(screen.getByTestId("room-standings")).toHaveAttribute(
      "data-phase",
      "results",
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    act(() => handlers.onMemberRemoved?.({ id: "other" }));
    expect(
      screen.getByRole("row", { name: /Other \(left\)/ }),
    ).toBeInTheDocument();
  });
  test("ignores delayed progress and preserves progress when a member rejoins", () => {
    render(<ScoreTable {...props} />);
    seed();
    act(() =>
      handlers.onProgress?.(
        { ...progress, playerId: "other", elapsedMs: 2000 },
        "other",
      ),
    );
    act(() =>
      handlers.onProgress?.(
        { ...progress, playerId: "other", typed: "he", elapsedMs: 1000 },
        "other",
      ),
    );
    act(() =>
      handlers.onMemberAdded?.({ id: "other", info: { name: "Other" } }),
    );
    expect(screen.getByRole("row", { name: /Other/ })).toHaveTextContent(
      "5 chars",
    );
  });
});
