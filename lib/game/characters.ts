const segmenter =
  typeof Intl.Segmenter === "undefined"
    ? null
    : new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** One visible character is one grapheme cluster. Bundled ASCII passages use
 * a fast path; Intl.Segmenter handles joined and combining Unicode input. */
export function characters(text: string): string[] {
  if (/^[\x00-\x7F]*$/.test(text)) return text.split("");
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}

export function sameCharacter(left: string, right: string): boolean {
  return left.normalize("NFC") === right.normalize("NFC");
}
