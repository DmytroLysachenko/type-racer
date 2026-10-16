import { PASSAGES } from "@/lib/content/passages";
import {
  CHALLENGE_EXERCISES,
  EASY_EXERCISES,
  NUMBER_EXERCISES,
  POLISH_EXERCISES,
  PUNCTUATION_EXERCISES,
  QUOTES,
} from "@/lib/content/practice-material";
import { characters } from "./characters";

export const PRACTICE_DURATIONS = [15, 30, 60, 120] as const;
export const PRACTICE_WORD_COUNTS = [25, 50, 100] as const;
export const PRACTICE_FOCUS_MODES = [
  { kind: "quote", label: "Short thoughts" },
  { kind: "punctuation", label: "Punctuation" },
  { kind: "numbers", label: "Numbers" },
  { kind: "easy", label: "Gentle pace" },
  { kind: "challenge", label: "Challenge" },
  { kind: "polish", label: "Polski" },
] as const;
export type FocusKind = (typeof PRACTICE_FOCUS_MODES)[number]["kind"];

export type PracticeMode =
  | { kind: "timed"; seconds: (typeof PRACTICE_DURATIONS)[number] }
  | { kind: "words"; count: (typeof PRACTICE_WORD_COUNTS)[number] }
  | { kind: FocusKind }
  | { kind: "custom" };

export const DEFAULT_PRACTICE_MODE: PracticeMode = {
  kind: "timed",
  seconds: 30,
};

export function parsePracticeMode(params: {
  mode?: string | string[];
  value?: string | string[];
}): PracticeMode {
  const value = Number(params.value);
  const duration = PRACTICE_DURATIONS.find((option) => option === value);
  const count = PRACTICE_WORD_COUNTS.find((option) => option === value);
  if (params.mode === "timed" && duration !== undefined)
    return { kind: "timed", seconds: duration };
  if (params.mode === "words" && count !== undefined)
    return { kind: "words", count };
  const focus = PRACTICE_FOCUS_MODES.find((item) => item.kind === params.mode);
  if (focus) return { kind: focus.kind };
  if (params.mode === "custom") return { kind: "custom" };
  return DEFAULT_PRACTICE_MODE;
}

export function practiceDurationMs(mode: PracticeMode): number {
  return mode.kind === "timed" ? mode.seconds * 1000 : Infinity;
}

export function normalizeCustomText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

export function validCustomText(text: string): boolean {
  const length = characters(normalizeCustomText(text)).length;
  return length >= 10 && length <= 1500;
}

export function practiceText(
  mode: PracticeMode,
  offset: number,
  customText = "",
): string {
  if (mode.kind === "custom") return normalizeCustomText(customText);
  const material = {
    quote: QUOTES,
    punctuation: PUNCTUATION_EXERCISES,
    numbers: NUMBER_EXERCISES,
    easy: EASY_EXERCISES,
    challenge: CHALLENGE_EXERCISES,
    polish: POLISH_EXERCISES,
  };
  if (mode.kind !== "timed" && mode.kind !== "words") {
    const bank = material[mode.kind];
    return bank[((offset % bank.length) + bank.length) % bank.length]!;
  }
  const start =
    ((offset % PASSAGES.length) + PASSAGES.length) % PASSAGES.length;
  const ordered = [...PASSAGES.slice(start), ...PASSAGES.slice(0, start)];
  const all = ordered.join(" ");
  if (mode.kind === "timed") return all;
  return all.split(/\s+/).slice(0, mode.count).join(" ");
}

/** Word-aligned windows keep the next text readable without rendering a long
 * passage on every keystroke. The trailing space belongs to the old window. */
export function practiceChunks(text: string) {
  const units = characters(text);
  const chunks: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < units.length;) {
    let end = Math.min(start + 80, units.length);
    if (end < units.length) {
      let breakAt = end;
      while (breakAt > start && units[breakAt - 1] !== " ") breakAt--;
      if (breakAt > start) end = breakAt;
    }
    chunks.push({ start, end });
    start = end;
  }
  return chunks;
}

export function practiceModeLabel(mode: PracticeMode): string {
  if (mode.kind === "timed") return `${mode.seconds}-second practice`;
  if (mode.kind === "words") return `${mode.count}-word practice`;
  if (mode.kind === "custom") return "Your own text";
  return PRACTICE_FOCUS_MODES.find((item) => item.kind === mode.kind)!.label;
}

export function practiceContentVersion(mode: PracticeMode): string {
  return mode.kind === "timed" || mode.kind === "words" ? "v2" : "v1";
}
