"use client";

import { ProfileCard } from "@/components/Profile";
import { Timer } from "@/components/Timer";
import { useRound } from "@/lib/hooks/useRound";
import { useEffect, useRef } from "react";

export default function Page() {
  const { round, secondsLeft } = useRound();
  const roundIdRef = useRef(round.id);
  useEffect(() => {
    roundIdRef.current = round.id;
  }, [round.id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <Timer secondsLeft={secondsLeft} />
      <ProfileCard />
    </div>
  );
}
