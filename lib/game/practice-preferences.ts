import {
  DEFAULT_PRACTICE_MODE,
  parsePracticeMode,
  type PracticeMode,
} from "./practice";

const KEY = "typearena-practice-mode-v1";

export function readPracticePreference(): PracticeMode {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRACTICE_MODE;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_PRACTICE_MODE;
    const mode = value as {
      kind?: unknown;
      seconds?: unknown;
      count?: unknown;
    };
    return parsePracticeMode({
      mode: typeof mode.kind === "string" ? mode.kind : undefined,
      value:
        typeof mode.seconds === "number"
          ? String(mode.seconds)
          : typeof mode.count === "number"
            ? String(mode.count)
            : undefined,
    });
  } catch {
    return DEFAULT_PRACTICE_MODE;
  }
}

export function savePracticePreference(mode: PracticeMode): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(mode));
    return true;
  } catch {
    return false;
  }
}
