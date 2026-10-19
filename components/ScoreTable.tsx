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
  const passageLength = Array.from(sentence).length;
  return (
    <section
      className="room-panel"
      aria-labelledby="room-heading"
      data-testid="room-standings"
      data-phase={phase}
    >
      <div className="room-heading-row">
        <div>
          <p className="eyebrow">
            {phase === "results" ? "FINAL ORDER" : "ON THE TRACK"}
          </p>
          <h2 id="room-heading">
            {phase === "results" ? "Round results" : "Live room"}
            <span className="room-count">
              {sorted.length} {sorted.length === 1 ? "RACER" : "RACERS"}
            </span>
          </h2>
        </div>
        <span
          className={`connection-status connection-${status}`}
          role="status"
          data-testid="room-connection"
          data-status={status}
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
            ? "Room connection failed. You can still race locally."
            : "Shared progress updates as the room types. Times are self-reported."
          : "Live room is offline. Your race still works locally."}
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
              <tr
                key={row.playerId}
                className={row.playerId === selfId ? "is-self" : undefined}
              >
                <td>
                  <span className="rank-value">
                    {phase === "results" && row.typed ? `#${index + 1}` : "—"}
                  </span>
                </td>
                <td>
                  <span className="player-name">{row.name}</span>
                  {row.playerId === selfId ? (
                    <span className="player-meta"> (you)</span>
                  ) : null}
                  {liveConfigured &&
                  status === "connected" &&
                  row.playerId !== selfId &&
                  !activeIds.has(row.playerId) ? (
                    <span className="player-meta"> (left)</span>
                  ) : null}
                </td>
                <td>
                  <span className="progress-value">
                    {row.metrics.totalChars} chars
                  </span>
                  {row.completed ? " · finished" : ""}
                  <span className="lane-progress" aria-hidden="true">
                    <span
                      style={{
                        transform: `scaleX(${row.metrics.totalChars / passageLength})`,
                      }}
                    />
                  </span>
                </td>
                <td>{Math.round(row.metrics.wpm)}</td>
                <td>
                  {row.metrics.totalChars > 0
                    ? `${Math.round(row.metrics.accuracy * 100)}%`
                    : "—"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" data-testid="room-empty">
                  {phase === "results"
                    ? "No racers joined this round."
                    : "The next racer will appear here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
