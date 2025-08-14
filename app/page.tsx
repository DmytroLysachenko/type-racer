"use client";

import { ProfileCard } from "@/components/Profile";
import { Timer } from "@/components/Timer";
import { TypingArea } from "@/components/TypingArea";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useRound } from "@/lib/hooks/useRound";
import { useEffect, useRef } from "react";

export default function Page() {
  const { round, secondsLeft } = useRound();

  const { player } = usePlayer();
  const roundIdRef = useRef(round.id);

  useEffect(() => {
    roundIdRef.current = round.id;
  }, [round.id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Timer secondsLeft={secondsLeft} />
      {player && (
        <TypingArea
          playerId={player.id}
          name={player.name}
          sentence={round.sentence}
        />
      )}

      <ProfileCard />
    </div>
  );
}
