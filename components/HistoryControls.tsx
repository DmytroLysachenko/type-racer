"use client";

import { useState } from "react";
import { clearHistory, exportHistory } from "@/lib/game/history";

/** Device-local data controls. No result or typed passage is sent to a server. */
export function HistoryControls() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  function download() {
    const blob = new Blob([exportHistory()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "typearena-results.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage("Results exported as JSON.");
  }

  function remove() {
    if (clearHistory()) setMessage("Results removed from this device.");
    else setMessage("Browser storage could not be cleared.");
    setConfirming(false);
  }

  return (
    <details className="history-controls">
      <summary>Manage results on this device</summary>
      <p>Export a copy or remove all saved race and practice results.</p>
      <div className="history-control-actions">
        <button type="button" onClick={download}>
          Export JSON
        </button>
        {confirming ? (
          <>
            <button type="button" onClick={remove}>
              Confirm deletion
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)}>
            Delete saved results
          </button>
        )}
      </div>
      {confirming && <p>This removes results from this browser permanently.</p>}
      <p role="status">{message}</p>
    </details>
  );
}
