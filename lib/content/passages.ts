/** Original TypeArena passages. Keep this set immutable after release: shared
 * round IDs depend on its order. Publish a new version to change the set. */
export const PASSAGE_VERSION = "v2";

export const PASSAGES = [
  "The bakery opens before dawn, and the first trays of bread cool beside a window fogged by rain.",
  "At the ferry stop, a child counts gulls while the harbor wakes under a pale October sky.",
  "An old map can make a familiar neighborhood feel like a place you have never walked.",
  "The gardener left a narrow path through the herbs so visitors could brush the leaves as they passed.",
  "A quiet library has its own weather: dry paper, soft footsteps, and a little pool of light at each desk.",
  "When the train paused outside town, everyone looked up from their screens to watch a field of horses.",
  "The soup needed more lemon, so Mara squeezed half a fruit into the pot and tasted it again.",
  "Rain tapped the greenhouse roof while the tomatoes hung in neat, bright rows above the soil.",
  "He kept a small notebook for useful phrases heard on buses, in markets, and over morning coffee.",
  "The last swimmer folded a towel, crossed the empty beach, and left a trail of footprints in the sand.",
  "A patient repair can give an old chair another decade at the table, where every scratch has a story.",
  "The museum guard knew which painting visitors passed too quickly and which one made them stop.",
  "On clear nights, the rooftop garden held the smell of mint long after the city lights came on.",
  "The river took a wide bend beyond the bridge, carrying fallen leaves toward farms downstream.",
  "Someone had pinned a recipe to the fridge with notes in three different kinds of handwriting.",
  "The bicycle bell rang once, and the dog stepped aside as though it understood the whole arrangement.",
  "After the storm, the market reopened with damp canvas roofs and baskets of late-season pears.",
  "The small theater held only forty seats, but each voice reached the back row without a microphone.",
  "A good pencil leaves room for second thoughts; the margin can be as useful as the first draft.",
  "The carpenter measured twice, paused to listen, and let the grain decide where the cut should go.",
  "By noon, the kitchen table was covered with envelopes, orange peels, and plans for the weekend.",
  "The lighthouse flashed across the bay while the fishing boats returned one by one through the dark.",
  "In spring, the path behind the school fills with small white flowers that close when evening comes.",
  "A radio played softly in the workshop as the mechanic sorted screws into jars with handwritten labels.",
] as const;

export function roundPassage(roundId: number): string {
  return PASSAGES[roundId % PASSAGES.length]!;
}
