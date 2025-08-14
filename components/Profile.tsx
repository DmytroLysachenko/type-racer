"use client";
import { useEffect, useState } from "react";

import { usePlayer } from "@/lib/hooks/usePlayer";

export function Profile() {
  const { player, updateName } = usePlayer();
  const [name, setName] = useState("");

  useEffect(() => {
    if (player) setName(player.name);
  }, [player]);

  if (!player) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-6 bg-white/10 rounded w-44 mb-2" />
        <div className="animate-pulse h-9 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <label
        className="font-medium mb-2"
        htmlFor="profile-name"
      >
        Your profile
      </label>
      <div className="flex items-center gap-2">
        <input
          id="profile-name"
          data-testid="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <button
          data-testid="save-profile"
          onClick={() => updateName(name)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
