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

  // listen for updates from this tab (custom event) and other tabs (storage)
  useEffect(() => {
    const onLocalUpdate = (e: Event) => {
      const p = (e as CustomEvent<PlayerLocal>).detail;
      setPlayer(p);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setPlayer(JSON.parse(e.newValue));
    };

    window.addEventListener(
      "typearena:player-updated",
      onLocalUpdate as EventListener
    );
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        "typearena:player-updated",
        onLocalUpdate as EventListener
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateName = (name: string) => {
    if (!player) return;

    const p = { ...player, name };

    localStorage.setItem(KEY, JSON.stringify(p));

    setPlayer(p);

    // notify other hook instances in this tab immediately
    window.dispatchEvent(
      new CustomEvent("typearena:player-updated", { detail: p })
    );

    // let the server know (so future rounds & history use the new name)
    fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).catch((err) => {
      console.error(err);
    });
  };

  return { player, updateName };
}
