import { useEffect, useMemo, useState } from "react";
import { getCurrentRound } from "../utils/rounds";

export function useRound() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const round = useMemo(() => getCurrentRound(now), [now]);

  const secondsLeft = Math.max(Math.ceil((round.endsAt - now) / 1000), 0);

  return { round, secondsLeft };
}
