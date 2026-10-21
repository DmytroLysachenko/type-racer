"use client";

import { useEffect, useState } from "react";
import { readHistory, type RaceRecord } from "@/lib/game/history";
import type { useTypingProgress } from "@/lib/hooks/useTypingProgress";
import { TypingInput } from "@/components/TypingInput";
import type { RoundPhase } from "@/lib/game/rounds";
import { characters, sameCharacter } from "@/lib/game/characters";
import type { ProgressPayload } from "@/lib/game/progress";

export function TypingArea({
  sentence,
  phase,
  secondsLeft,
  typing,
  peers,
}: {
  sentence: string;
  phase: RoundPhase;
  secondsLeft: number;
  typing: ReturnType<typeof useTypingProgress>;
  peers: ProgressPayload[];
}) {
  const { race, typed, setTyped, metrics } = typing;
  const [history, setHistory] = useState<RaceRecord[]>([]);
  useEffect(() => {
    const update = () => setHistory(readHistory());
    window.addEventListener("typearena:history-updated", update);
    const frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("typearena:history-updated", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  const target = characters(sentence);
  const entered = characters(typed);
  const peerMarkers = new Map<number, string[]>();
  if (phase === "racing" && target.length > 0) {
    for (const peer of peers) {
      const position = Math.min(
        characters(peer.typed).length,
        target.length - 1,
      );
      const names = peerMarkers.get(position) ?? [];
      names.push(peer.name);
      peerMarkers.set(position, names);
    }
  }
  const progress = Math.round((entered.length / target.length) * 100);
  const raceHistory = history.filter((item) => item.mode.kind === "shared");
  const best = raceHistory.length
    ? Math.max(...raceHistory.map((item) => item.metrics.wpm))
    : null;

  return (
    <section
      className={`race-panel phase-${phase}`}
      aria-labelledby="race-heading"
    >
      <div className="race-topline">
        <div>
          <p className="eyebrow">
            {phase === "lobby"
              ? "UP NEXT"
              : phase === "results"
                ? "AT THE LINE"
                : "THE PASSAGE"}
          </p>
          <h2 id="race-heading">
            {phase === "lobby"
              ? "Read the line. Get ready."
              : phase === "results"
                ? "Your run is in"
                : "Find your rhythm"}
          </h2>
        </div>
        <div
          className="clock"
          role="timer"
          data-testid="round-clock"
          aria-label={`${secondsLeft} seconds until ${phase === "lobby" ? "race starts" : phase === "racing" ? "race ends" : "next lobby"}`}
        >
          <span data-testid="clock-seconds">
            {String(secondsLeft).padStart(2, "0")}
          </span>
          <small>
            {phase === "lobby"
              ? "TO START"
              : phase === "racing"
                ? "REMAINING"
                : "TO LOBBY"}
          </small>
        </div>
      </div>
      {phase !== "results" && (
        <>
          <div className="prompt-frame">
            <div className="prompt-topline" aria-hidden="true">
              <span>TYPE THIS PASSAGE</span>
              <span>{target.length} CHARACTERS</span>
            </div>
            <div
              className="passage"
              aria-hidden="true"
              data-testid="race-passage"
            >
              {target.map((ch, i) => {
                const marker = peerMarkers.get(i);
                const state =
                  i === entered.length && race.phase !== "completed"
                    ? "caret"
                    : entered[i] === undefined
                      ? "pending"
                      : sameCharacter(entered[i]!, ch)
                        ? "correct"
                        : "incorrect";
                return (
                  <span
                    key={i}
                    className={`${state}${marker ? " has-peer-marker" : ""}`}
                    data-peer-position={marker ? i : undefined}
                    data-peer-marker={
                      marker
                        ? marker.length === 1
                          ? marker[0]
                          : `${marker[0]} +${marker.length - 1}`
                        : undefined
                    }
                    title={marker?.join(", ")}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
          <p id="passage-text" className="sr-only">
            Type this text: {sentence}
          </p>
          <TypingInput
            id="typing"
            label="YOUR INPUT"
            description="Backspace to correct. Bulk paste is ignored."
            value={typed}
            onInput={setTyped}
            disabled={
              phase !== "racing" ||
              race.phase === "completed" ||
              secondsLeft === 0
            }
            placeholder={
              phase === "lobby"
                ? "Race starts shortly…"
                : race.phase === "completed"
                  ? "Race complete"
                  : "Start typing here…"
            }
            describedBy="passage-text"
          />
          <div className="progress-heading" aria-hidden="true">
            <span>PASSAGE PROGRESS</span>
            <span>{progress}%</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Passage progress"
          >
            <span
              data-testid="progress-fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <div className="stat-grid" aria-label="Live statistics">
            <div>
              <strong>{Math.round(metrics.wpm)}</strong>
              <span>Net WPM</span>
            </div>
            <div>
              <strong>{Math.round(metrics.rawWpm)}</strong>
              <span>Raw WPM</span>
            </div>
            <div>
              <strong>
                {race.phase === "ready"
                  ? "—"
                  : `${Math.round(metrics.accuracy * 100)}%`}
              </strong>
              <span>Accuracy</span>
            </div>
            <div data-testid="stat-mistakes">
              <strong>{metrics.mistakes}</strong>
              <span>Mistakes</span>
            </div>
          </div>
        </>
      )}
      {phase === "results" || race.phase === "completed" ? (
        <div className="result" role="status" data-testid="race-result">
          <div>
            <p className="eyebrow">
              {race.phase === "ready"
                ? "Round finished"
                : "Finished this round"}
            </p>
            <h3>
              {race.phase === "ready" ? (
                "Join the next race"
              ) : (
                <>
                  <strong>{Math.round(metrics.wpm)}</strong>
                  <span>NET WPM</span>
                </>
              )}
            </h3>
            {race.phase !== "ready" && (
              <p>
                {metrics.correctedErrors} corrected ·{" "}
                {metrics.uncorrectedErrors} remaining ·{" "}
                {Math.round(metrics.cpm)} CPM
              </p>
            )}
          </div>
          <p>The next lobby opens when the clock resets.</p>
        </div>
      ) : (
        <p className="race-status" aria-live="polite">
          {phase === "lobby"
            ? "The passage is visible. Typing opens at the start."
            : race.phase === "ready"
              ? "Race now — the clock is running"
              : "Keep your rhythm"}
        </p>
      )}
      <p className="personal-best" data-testid="personal-best">
        {best === null
          ? "Complete a race to set your personal best."
          : `Personal best on this device: ${Math.round(best)} WPM`}
      </p>
      {raceHistory.length > 0 && (
        <details className="history-list">
          <summary>Recent sessions</summary>
          <ol>
            {raceHistory.slice(0, 5).map((item) => (
              <li key={item.id}>
                <span>{new Date(item.finishedAt).toLocaleDateString()}</span>
                <strong>{Math.round(item.metrics.wpm)} WPM</strong>
                <span>{Math.round(item.metrics.accuracy * 100)}% accuracy</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
