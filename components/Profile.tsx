"use client";

import { useState } from "react";
import { Button, TextField } from "@/components/ui";
import type { PlayerLocal } from "@/lib/hooks/usePlayer";

export function Profile({
  player,
  updateName,
}: {
  player: PlayerLocal;
  updateName: (name: string) => Promise<boolean>;
}) {
  const [message, setMessage] = useState("");
  return (
    <ProfileForm
      key={player.name}
      player={player}
      updateName={updateName}
      message={message}
      setMessage={setMessage}
    />
  );
}

function ProfileForm({
  player,
  updateName,
  message,
  setMessage,
}: {
  player: PlayerLocal;
  updateName: (name: string) => Promise<boolean>;
  message: string;
  setMessage: (message: string) => void;
}) {
  const [name, setName] = useState(player.name);
  const [saving, setSaving] = useState(false);
  return (
    <section className="profile-panel" aria-labelledby="profile-heading">
      <p className="eyebrow">Your space</p>
      <h2 id="profile-heading">Guest profile</h2>
      <form
        className="profile-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (saving) return;
          setSaving(true);
          setMessage("Saving…");
          const saved = await updateName(name);
          setMessage(
            saved
              ? "Name saved on this device."
              : "Could not save the name. Use 1–32 characters and try again.",
          );
          setSaving(false);
        }}
      >
        <div className="profile-form-row">
          <TextField
            id="profile-name"
            label="Display name"
            className="profile-field"
            data-testid="profile-name"
            name="display-name"
            autoComplete="off"
            spellCheck={false}
            value={name}
            maxLength={32}
            onChange={(event) => setName(event.target.value)}
          />
          <Button data-testid="save-profile" type="submit" pending={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="profile-message" role="status">
          {message}
        </p>
      </form>
      <p className="muted">
        No account is required. Your name and race history stay in this browser.
      </p>
    </section>
  );
}
