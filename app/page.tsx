"use client";

import { useEffect, useRef } from "react";

import { ScoreTable } from "@/components/ScoreTable";
import { Timer } from "@/components/Timer";
import { TypingArea } from "@/components/TypingArea";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useRound } from "@/lib/hooks/useRound";
import { Profile } from "@/components/Profile";

export default function Page() {
  const { round, secondsLeft } = useRound();
  const { player } = usePlayer();

  // Ensure server knows your name/id
  useEffect(() => {
    if (!player) return;

    fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    }).catch(() => {
      console.error("Failed to join");
    });

    return () => {};
  }, [player]);

  const roundIdRef = useRef(round.id);
  useEffect(() => {
    roundIdRef.current = round.id;
  }, [round.id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Timer secondsLeft={secondsLeft} />
      {player && (
        <>
          <TypingArea
            playerId={player.id}
            name={player.name}
            sentence={round.sentence}
          />
          <ScoreTable selfId={player.id} />
        </>
      )}

      <Profile />
    </div>
  );
}
