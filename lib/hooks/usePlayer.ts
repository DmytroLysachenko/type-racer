import { useEffect, useState } from "react";

type PlayerLocal = { id: string; name: string };

const KEY = "typearena-player";

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerLocal | null>(null);

  // initial load
  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      setPlayer(JSON.parse(stored));
    } else {
      const p = {
        id: crypto.randomUUID(),
        name: "Guest-" + Math.floor(Math.random() * 1000),
      };
      localStorage.setItem(KEY, JSON.stringify(p));
      setPlayer(p);
    }
  }, []);

  const updateName = (name: string) => {
    if (!player) return;

    const updatedPlayer = { ...player, name };

    localStorage.setItem(KEY, JSON.stringify(updatedPlayer));

    setPlayer(updatedPlayer);
  };

  return { player, updateName };
}
