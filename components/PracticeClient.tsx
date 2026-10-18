"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TypingInput } from "@/components/TypingInput";
import { HistoryControls } from "@/components/HistoryControls";
import { Button } from "@/components/ui";
import { characters, sameCharacter } from "@/lib/game/characters";
import { readHistory, saveRace, type RaceRecord } from "@/lib/game/history";
import {
  frequentMistypedTargets,
  practiceRecommendation,
  reviewPassage,
  summarizeMistypedTargets,
} from "@/lib/game/insights";
import { computeMetrics } from "@/lib/game/metrics";
import {
  PRACTICE_DURATIONS,
  PRACTICE_FOCUS_MODES,
  PRACTICE_WORD_COUNTS,
  normalizeCustomText,
  practiceChunks,
  practiceContentVersion,
  practiceDurationMs,
  practiceModeLabel,
  practiceText,
  validCustomText,
  type PracticeMode,
} from "@/lib/game/practice";
import {
  readPracticePreference,
  savePracticePreference,
} from "@/lib/game/practice-preferences";
import {
  commitComposition,
  createRace,
  inputRace,
  tickRace,
} from "@/lib/game/session";

function sameMode(left: PracticeMode, right: RaceRecord["mode"]): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "timed" && right.kind === "timed")
    return left.seconds === right.seconds;
  if (left.kind === "words" && right.kind === "words")
    return left.count === right.count;
  return true;
}

function PracticeRun({
  mode,
  passage,
  chunks,
  onRestart,
  onReview,
}: {
  mode: PracticeMode;
  passage: string;
  chunks: Array<{ start: number; end: number }>;
  onRestart: () => void;
  onReview: (passage: string) => void;
}) {
  const [race, setRace] = useState(createRace);
  const [history, setHistory] = useState<RaceRecord[]>([]);
  const saved = useRef(false);
  const durationMs = practiceDurationMs(mode);

  useEffect(() => {
    const update = () => setHistory(readHistory());
    window.addEventListener("typearena:history-updated", update);
    const frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener("typearena:history-updated", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (race.phase !== "running") return;
    const advance = () =>
      setRace((previous) =>
        tickRace(previous, passage, performance.now(), durationMs),
      );
    const timer = window.setInterval(advance, 250);
    document.addEventListener("visibilitychange", advance);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", advance);
    };
  }, [race.phase, passage, durationMs]);

  useEffect(() => {
    if (race.phase !== "completed" || !race.result || saved.current) return;
    saved.current = true;
    if (mode.kind !== "custom")
      saveRace({
        id: crypto.randomUUID(),
        finishedAt: Date.now(),
        sentence: passage,
        metrics: race.result,
        mistypedTargets: summarizeMistypedTargets(race.mistypedTargets),
        mode,
        contentVersion: practiceContentVersion(mode),
      });
  }, [race.phase, race.result, race.mistypedTargets, passage, mode]);

  const enter = useCallback(
    (proposed: string, composed = false) => {
      const now = performance.now();
      setRace((previous) =>
        (composed ? commitComposition : inputRace)(
          previous,
          passage,
          proposed,
          now,
          durationMs,
        ),
      );
    },
    [passage, durationMs],
  );

  const target = useMemo(() => characters(passage), [passage]);
  const entered = characters(race.typed);
  const chunkIndex = Math.max(
    0,
    chunks.findIndex((chunk) => entered.length < chunk.end),
  );
  const currentChunk = chunks[chunkIndex]!;
  const nextChunk = chunks[chunkIndex + 1];
  const displayChunks = nextChunk ? [currentChunk, nextChunk] : [currentChunk];
  const visible = target.slice(currentChunk.start, currentChunk.end);
  const metrics =
    race.result ?? computeMetrics(passage, race.typed, race.elapsedMs, race);
  const progress = Math.round((entered.length / target.length) * 100);
  const previous = history.filter((item) => sameMode(mode, item.mode));
  const best = previous.length
    ? Math.max(...previous.map((item) => item.metrics.wpm))
    : null;
  const weakCharacters = frequentMistypedTargets(previous);
  const recommendation =
    race.phase === "completed" ? practiceRecommendation(metrics) : null;
  const review = race.phase === "completed" ? reviewPassage(previous) : null;
  const seconds =
    mode.kind === "timed"
      ? Math.max(0, Math.ceil((durationMs - race.elapsedMs) / 1000))
      : Math.floor(race.elapsedMs / 1000);

  return (
    <section
      className="practice-run panel"
      aria-labelledby="practice-run-heading"
      lang={mode.kind === "polish" ? "pl" : undefined}
    >
      <div className="practice-run-heading">
        <div>
          <p className="eyebrow">{practiceModeLabel(mode)}</p>
          <h2 id="practice-run-heading">
            {race.phase === "completed" ? "Your result" : "Start typing"}
          </h2>
        </div>
        <div
          className="practice-clock"
          role="timer"
          aria-label={
            mode.kind === "timed"
              ? `${seconds} seconds remaining`
              : `${seconds} seconds elapsed`
          }
        >
          <strong>{String(seconds).padStart(2, "0")}</strong>
          <span>{mode.kind === "timed" ? "remaining" : "elapsed"}</span>
        </div>
      </div>

      {race.phase === "completed" ? (
        <div
          className="practice-result"
          role="status"
          data-testid="practice-result"
        >
          <div className="practice-result-main">
            <strong>{Math.round(metrics.wpm)}</strong>
            <span>net WPM</span>
          </div>
          <div className="practice-result-grid">
            <p>
              <strong>{Math.round(metrics.rawWpm)}</strong>
              <span>raw WPM</span>
            </p>
            <p>
              <strong>{Math.round(metrics.accuracy * 100)}%</strong>
              <span>accuracy</span>
            </p>
            <p>
              <strong>{metrics.correctedErrors}</strong>
              <span>corrected errors</span>
            </p>
            <p>
              <strong>{metrics.uncorrectedErrors}</strong>
              <span>remaining errors</span>
            </p>
          </div>
          <p className="practice-metric-help">
            Net WPM counts characters correct at their positions. Raw WPM also
            counts erased characters. Accuracy compares correct characters with
            the characters left in your input. Corrected errors were removed;
            remaining errors are still in your input.
          </p>
          {recommendation && (
            <p className="practice-insight">Next step: {recommendation}</p>
          )}
          {weakCharacters.length > 0 && (
            <p className="practice-insight">
              Frequently missed target characters in recent saved tests:{" "}
              {weakCharacters.join(", ")}.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="prompt-frame practice-prompt">
            <div className="prompt-topline" aria-hidden="true">
              <span>TYPE THIS PASSAGE</span>
              <span>{progress}% COMPLETE</span>
            </div>
            <div
              className="passage"
              aria-hidden="true"
              data-testid="practice-passage"
            >
              {displayChunks.map((chunk, group) => (
                <span
                  key={chunk.start}
                  className={group === 1 ? "practice-next-chunk" : undefined}
                >
                  {target
                    .slice(chunk.start, chunk.end)
                    .map((character, index) => {
                      const position = chunk.start + index;
                      return (
                        <span
                          key={position}
                          className={
                            position === entered.length
                              ? "caret"
                              : entered[position] === undefined
                                ? "pending"
                                : sameCharacter(entered[position]!, character)
                                  ? "correct"
                                  : "incorrect"
                          }
                        >
                          {character}
                        </span>
                      );
                    })}
                </span>
              ))}
            </div>
          </div>
          <p className="sr-only" id="practice-passage-text">
            Type this part of the passage: {visible.join("")}
          </p>
          <TypingInput
            id="practice-typing"
            label="YOUR INPUT"
            value={race.typed}
            onInput={enter}
            disabled={false}
            placeholder="Start typing here…"
            description="The timer starts with your first character. Backspace corrects. Bulk paste is ignored."
            describedBy="practice-passage-text"
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
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </>
      )}
      <div className="practice-actions">
        <Button
          type="button"
          onClick={() => {
            onRestart();
            requestAnimationFrame(() =>
              document.getElementById("practice-typing")?.focus(),
            );
          }}
        >
          {race.phase === "completed" ? "Try another passage" : "Restart test"}
        </Button>
        {review && (
          <Button
            type="button"
            onClick={() => {
              onReview(review);
              requestAnimationFrame(() =>
                document.getElementById("practice-typing")?.focus(),
              );
            }}
          >
            Retry a missed character
          </Button>
        )}
        <p>
          {mode.kind === "custom"
            ? "Custom text and its result are not saved."
            : best === null
              ? "Complete a test to set a personal best for this mode."
              : `Best for this mode: ${Math.round(best)} net WPM`}
        </p>
      </div>
      {previous.length > 0 && (
        <details className="history-list practice-history">
          <summary>Recent results for this mode</summary>
          <div className="practice-chart" aria-hidden="true">
            {previous
              .slice(0, 5)
              .reverse()
              .map((item) => (
                <span
                  key={item.id}
                  style={{
                    height: `${Math.max(8, (item.metrics.wpm / Math.max(1, best ?? 1)) * 100)}%`,
                  }}
                />
              ))}
          </div>
          <ol>
            {previous.slice(0, 5).map((item) => (
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

export function PracticeClient({
  initialMode,
  useSavedMode = false,
}: {
  initialMode: PracticeMode;
  useSavedMode?: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [seed, setSeed] = useState(0);
  const [customDraft, setCustomDraft] = useState("");
  const [customText, setCustomText] = useState("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!useSavedMode) return;
    const frame = requestAnimationFrame(() =>
      setMode(readPracticePreference()),
    );
    return () => cancelAnimationFrame(frame);
  }, [useSavedMode]);

  function selectMode(next: PracticeMode) {
    setMode(next);
    setCustomText("");
    setReviewText("");
    savePracticePreference(next);
    setSeed((current) => current + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", next.kind);
    if (next.kind === "timed" || next.kind === "words")
      url.searchParams.set(
        "value",
        String(next.kind === "timed" ? next.seconds : next.count),
      );
    else url.searchParams.delete("value");
    window.history.replaceState(null, "", url);
  }

  const passage = reviewText || practiceText(mode, seed, customText);
  const chunks = passage ? practiceChunks(passage) : [];
  const key = `${mode.kind}-${mode.kind === "timed" ? mode.seconds : mode.kind === "words" ? mode.count : ""}-${seed}`;
  return (
    <div className="practice-layout">
      <div className="practice-options" aria-label="Practice options">
        <div
          className="practice-option-group"
          role="group"
          aria-label="Timed test length"
        >
          <h2>Timed</h2>
          <p>Type for a fixed time.</p>
          <div className="practice-option-row">
            {PRACTICE_DURATIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                aria-pressed={mode.kind === "timed" && mode.seconds === seconds}
                onClick={() => selectMode({ kind: "timed", seconds })}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
        <div
          className="practice-option-group"
          role="group"
          aria-label="Word-count test length"
        >
          <h2>Words</h2>
          <p>Finish a set number of words.</p>
          <div className="practice-option-row">
            {PRACTICE_WORD_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={mode.kind === "words" && mode.count === count}
                onClick={() => selectMode({ kind: "words", count })}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>
      {mode.kind === "custom" && !customText && (
        <div className="custom-editor panel">
          <label htmlFor="custom-practice-text">Text to practice</label>
          <textarea
            id="custom-practice-text"
            value={customDraft}
            onChange={(event) => setCustomDraft(event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Paste or write a passage you have the right to use."
          />
          <p>
            Use 10–1,500 visible characters. Your text and result stay in this
            tab.
          </p>
          <Button
            type="button"
            disabled={!validCustomText(customDraft)}
            onClick={() => {
              setCustomText(normalizeCustomText(customDraft));
              setSeed((current) => current + 1);
            }}
          >
            Start custom test
          </Button>
        </div>
      )}
      {passage && (
        <PracticeRun
          key={key}
          mode={mode}
          passage={passage}
          chunks={chunks}
          onRestart={() => {
            setReviewText("");
            setSeed((current) => current + 1);
          }}
          onReview={(text) => {
            setReviewText(text);
            setSeed((current) => current + 1);
          }}
        />
      )}
      <details className="practice-extra">
        <summary>More ways to practice</summary>
        <div
          className="practice-option-row"
          role="group"
          aria-label="Focused practice"
        >
          {PRACTICE_FOCUS_MODES.map((option) => (
            <button
              key={option.kind}
              type="button"
              aria-pressed={mode.kind === option.kind}
              onClick={() => selectMode({ kind: option.kind })}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={mode.kind === "custom"}
            onClick={() => selectMode({ kind: "custom" })}
          >
            Your text
          </button>
        </div>
      </details>
      <HistoryControls />
    </div>
  );
}
