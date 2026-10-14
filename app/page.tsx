"use client";

import Link from "next/link";
import { Profile } from "@/components/Profile";
import { RaceRound } from "@/components/RaceRound";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useRound } from "@/lib/hooks/useRound";

export default function Page() {
  const { player, updateName } = usePlayer();
  const current = useRound();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="TypeArena home">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>{" "}
          TypeArena
        </Link>
        <span className="header-note">Race together, get faster</span>
      </header>
      <main id="main-content">
        <div className="intro">
          <div>
            <p className="eyebrow">Live multiplayer · shared rounds</p>
            <h1>Race the room.</h1>
          </div>
          <p>
            Join the lobby, race the same passage for 20 seconds, then see the
            room results together.
          </p>
        </div>
        {player && current ? (
          <>
            <div className={`round-banner round-${current.round.phase}`}>
              <div>
                <span className="round-indicator" aria-hidden="true" />
                <strong>
                  {current.round.phase === "lobby"
                    ? "Lobby open"
                    : current.round.phase === "racing"
                      ? "Race live"
                      : "Results are in"}
                </strong>
                <span className="round-banner-detail">
                  {current.round.phase === "lobby"
                    ? "Same passage. Same start."
                    : current.round.phase === "racing"
                      ? "Type as far as you can."
                      : "Standings hold until the next lobby."}
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
      </main>
      <footer className="site-footer">
        Practice with intention. Results are stored only in this browser.
      </footer>
    </div>
  );
}
