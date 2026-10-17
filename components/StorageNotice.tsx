"use client";

import { useEffect, useState } from "react";

export function StorageNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onFailure = () => setVisible(true);
    window.addEventListener("typearena:storage-failed", onFailure);
    return () =>
      window.removeEventListener("typearena:storage-failed", onFailure);
  }, []);
  if (!visible) return null;
  return (
    <div className="storage-notice" role="alert">
      <span>
        Your result could not be saved on this device. Check browser storage
        settings before your next test.
      </span>
      <button type="button" onClick={() => setVisible(false)}>
        Dismiss
      </button>
    </div>
  );
}
