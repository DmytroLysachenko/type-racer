"use client";

import { useEffect, useState } from "react";
import { readHistory, type RaceRecord } from "@/lib/game/history";
import type { useTypingProgress } from "@/lib/hooks/useTypingProgress";
import { TextField } from "@/components/ui";
import type { RoundPhase } from "@/lib/game/rounds";

export function TypingArea({
  sentence,
  phase,
  secondsLeft,
  typing,
}: {
  sentence: string;
  phase: RoundPhase;
  secondsLeft: number;
  typing: ReturnType<typeof useTypingProgress>;
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
  const target = Array.from(sentence);
  const entered = Array.from(typed);
  const progress = Math.round((entered.length / target.length) * 100);
  const best = history.length
    ? Math.max(...history.map((item) => item.metrics.wpm))
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
              ? "Up next"
              : phase === "results"
                ? "Round over"
                : "The passage"}
          </p>
          <h2 id="race-heading">
            {phase === "lobby"
              ? "Get ready to race"
              : phase === "results"
                ? "Race results"
                : "One line at a time"}
          </h2>
        </div>
        <div
          className="clock"
          role="timer"
          aria-label={`${secondsLeft} seconds until ${phase === "lobby" ? "race starts" : phase === "racing" ? "race ends" : "next lobby"}`}
        >
          <span>{secondsLeft}</span>
          <small>
            {phase === "lobby"
              ? "to start"
              : phase === "racing"
                ? "to finish"
                : "to lobby"}
          </small>
        </div>
      </div>
      {phase !== "results" && (
        <>
          <div className="passage" aria-hidden="true">
            {target.map((ch, i) => (
              <span
                key={i}
                className={
                  i === entered.length && race.phase !== "completed"
                    ? "caret"
                    : entered[i] === undefined
                      ? "pending"
                      : entered[i] === ch
                        ? "correct"
                        : "incorrect"
                }
              >
                {ch}
              </span>
            ))}
          </div>
          <p id="passage-text" className="sr-only">
            Type this text: {sentence}
          </p>
          <TextField
            id="typing"
            label="Type the passage"
            inputClassName="typing-input"
            description="Backspace corrects your last character. The race accepts one typed character at a time."
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onClick={(event) =>
              event.currentTarget.setSelectionRange(
                event.currentTarget.value.length,
                event.currentTarget.value.length,
              )
            }
            name="race-input"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
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
            aria-describedby="passage-text"
          />
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Passage progress"
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
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
            <div>
              <strong>{metrics.mistakes}</strong>
              <span>Mistakes</span>
            </div>
          </div>
        </>
      )}
      {phase === "results" || race.phase === "completed" ? (
        <div className="result" role="status">
          <div>
            <p className="eyebrow">
              {race.phase === "ready"
                ? "Round finished"
                : "Finished this round"}
            </p>
            <h3>
              {race.phase === "ready"
                ? "Join the next race"
                : `${Math.round(metrics.wpm)} net WPM`}
            </h3>
            <p>
              {metrics.correctedErrors} corrected · {metrics.uncorrectedErrors}{" "}
              remaining · {Math.round(metrics.cpm)} CPM
            </p>
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
      <p className="personal-best">
        {best === null
          ? "Complete a race to set your personal best."
          : `Personal best on this device: ${Math.round(best)} WPM`}
      </p>
      {history.length > 0 && (
        <details className="history-list">
          <summary>Recent sessions</summary>
          <ol>
            {history.slice(0, 5).map((item) => (
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
