"use client";

import { Profile } from "@/components/Profile";
import { RaceRound } from "@/components/RaceRound";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useRound } from "@/lib/hooks/useRound";

export function RaceClient() {
  const { player, updateName } = usePlayer();
  const current = useRound();

  return (
    <>
      {player && current ? (
        <>
          <div
            className={`round-banner round-${current.round.phase}`}
            data-testid="round-phase"
            data-phase={current.round.phase}
            data-synced={current.synced}
          >
            <div className="round-summary">
              <span className="round-indicator" aria-hidden="true" />
              <div>
                <strong>
                  {current.round.phase === "lobby"
                    ? "Lobby open"
                    : current.round.phase === "racing"
                      ? "Race live"
                      : "Results are in"}
                </strong>
                <span className="round-banner-detail">
                  {current.round.phase === "lobby"
                    ? "Next start is approaching"
                    : current.round.phase === "racing"
                      ? "The clock is running"
                      : "Next lobby opens shortly"}
                </span>
              </div>
            </div>
            <div className="phase-rail" role="group" aria-label="Round phases">
              <span
                className={current.round.phase === "lobby" ? "is-current" : ""}
              >
                Lobby <small>05</small>
              </span>
              <span
                className={current.round.phase === "racing" ? "is-current" : ""}
              >
                Race <small>20</small>
              </span>
              <span
                className={
                  current.round.phase === "results" ? "is-current" : ""
                }
              >
                Results <small>06</small>
              </span>
            </div>
            <span className="sync-state">
              {current.synced ? "Server clock synced" : "Using device clock"}
            </span>
          </div>
          <div className="round-layout">
            <RaceRound
              key={current.round.id}
              playerId={player.id}
              name={player.name}
              round={current.round}
              remainingMs={Math.max(0, current.round.endsAt - current.now)}
              secondsLeft={current.secondsLeft}
            />
            <Profile player={player} updateName={updateName} />
          </div>
        </>
      ) : (
        <p className="panel" role="status">
          Preparing your guest session…
        </p>
      )}
    </>
  );
}
