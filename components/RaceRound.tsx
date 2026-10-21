"use client";

import { ScoreTable } from "@/components/ScoreTable";
import { TypingArea } from "@/components/TypingArea";
import { useTypingProgress } from "@/lib/hooks/useTypingProgress";
import { useRoomStandings } from "@/lib/hooks/useRoomStandings";
import type { RoundInfo } from "@/lib/game/rounds";

/** One keyed race owns the typing session and gives both views its progress. */
export function RaceRound({
  playerId,
  name,
  round,
  remainingMs,
  secondsLeft,
}: {
  playerId: string;
  name: string;
  round: RoundInfo;
  remainingMs: number;
  secondsLeft: number;
}) {
  const typing = useTypingProgress({
    playerId,
    name,
    sentence: round.sentence,
    roundId: round.id,
    phase: round.phase,
    remainingMs,
  });
  const standings = useRoomStandings(
    round.id,
    round.sentence,
    playerId,
    name,
    typing.progress,
  );
  return (
    <>
      <TypingArea
        sentence={round.sentence}
        phase={round.phase}
        secondsLeft={secondsLeft}
        typing={typing}
        peers={
          standings.status === "connected"
            ? standings.rows.filter(
                (row) =>
                  row.playerId !== playerId &&
                  standings.activeIds.has(row.playerId),
              )
            : []
        }
      />
      <ScoreTable
        selfId={playerId}
        phase={round.phase}
        sentence={round.sentence}
        standings={standings}
      />
    </>
  );
}
