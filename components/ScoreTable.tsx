"use client";

import { useRoomStandings } from "@/lib/hooks/useRoomStandings";
import type { ProgressPayload } from "@/lib/game/progress";
import { liveConfigured } from "@/lib/pusher.client";
import type { RoundPhase } from "@/lib/game/rounds";

export function ScoreTable({
  selfId,
  roundId,
  phase,
  sentence,
  localProgress,
}: {
  selfId: string;
  roundId: number;
  phase: RoundPhase;
  sentence: string;
  localProgress?: ProgressPayload;
}) {
  const {
    rows: sorted,
    status,
    activeIds,
  } = useRoomStandings(roundId, sentence, selfId, localProgress);
  return (
    <section className="room-panel" aria-labelledby="room-heading">
      <div className="room-heading-row">
        <div>
          <p className="eyebrow">
            {phase === "results" ? "Round complete" : "Room"}
          </p>
          <h2 id="room-heading">
            {phase === "results" ? "Round results" : "Live room"}
          </h2>
        </div>
        <span
          className={`connection-status connection-${status}`}
          role="status"
        >
          {status === "connected"
            ? "Connected"
            : status === "connecting"
              ? "Connecting"
              : status === "unavailable" || status === "failed"
                ? "Room unavailable"
                : "Offline"}
        </span>
      </div>
      <p className="muted room-description">
        {liveConfigured
          ? status === "unavailable" || status === "failed"
            ? "The live room could not connect. Try refreshing shortly; you can still type locally."
            : "Live standings are shared with the room. Guest scores are unverified."
          : "Live room is offline. Typing is available locally."}
      </p>
      <div
        className="table-wrap"
        role="region"
        aria-label="Room standings"
        tabIndex={0}
      >
        <table className="score-table">
          <caption className="sr-only">
            {phase === "results"
              ? "Final round standings"
              : "Live round standings"}
          </caption>
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Player</th>
              <th scope="col">Progress</th>
              <th scope="col">WPM</th>
              <th scope="col">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.playerId}>
                <td>
                  {phase === "results" && row.typed ? `#${index + 1}` : "—"}
                </td>
                <td>
                  {row.name}
                  {row.playerId === selfId ? " (you)" : ""}
                  {liveConfigured &&
                  status === "connected" &&
                  row.playerId !== selfId &&
                  !activeIds.has(row.playerId)
                    ? " (left)"
                    : ""}
                </td>
                <td>
                  {Array.from(row.typed).length} chars
                  {row.completed ? " · finished" : ""}
                </td>
                <td>{Math.round(row.metrics.wpm)}</td>
                <td>{Math.round(row.metrics.accuracy * 100)}%</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {phase === "results"
                    ? "No racers joined this round."
                    : "Waiting for racers to join."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
