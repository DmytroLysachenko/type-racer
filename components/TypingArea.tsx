"use client";

import { useRound } from "@/lib/hooks/useRound";
import { useTypingProgress } from "@/lib/hooks/useTypingProgress";

export function TypingArea({
  playerId,
  name,
  sentence,
}: {
  playerId: string;
  name: string;
  sentence: string;
}) {
  const { round, secondsLeft } = useRound();

  const { typed, setTyped, metrics } = useTypingProgress({
    playerId,
    name,
    sentence,
    roundId: round.id,
  });

  return (
    <div className={`rounded-2xl p-4`}>
      <div className="mb-3 text-lg leading-7">
        {sentence.split("").map((ch, i) => {
          const typedCh = typed[i];
          const state =
            typedCh == null ? "pending" : typedCh === ch ? "correct" : "wrong";
          return (
            <span
              key={i}
              className={
                state === "pending"
                  ? "text-gray-300"
                  : state === "correct"
                  ? "text-emerald-500"
                  : "text-rose-500 underline"
              }
            >
              {ch}
            </span>
          );
        })}
      </div>

      <input
        className="px-3 py-2 rounded-xl w-full my-4"
        id="typing"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Type here…"
      />

      <div className="flex items-center gap-4 text-sm">
        <div>
          WPM: <span className="font-semibold">{Math.round(metrics.wpm)}</span>
        </div>
        <div>
          Accuracy:{" "}
          <span className="font-semibold">
            {(metrics.accuracy * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
