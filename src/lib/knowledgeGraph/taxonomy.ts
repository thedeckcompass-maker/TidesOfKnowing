import {
  RECENT_CLIENT_DOMINANT_SUITS,
  RECENT_CLIENT_LIFE_AREAS,
  RECENT_CLIENT_SPREADS,
  type RecentClientReadingType,
} from "../recentClientReadingsTaxonomy";
import type { RepeatingCardSuitFolder } from "../repeatingCardMeanings";

export {
  RECENT_CLIENT_LIFE_AREAS,
  RECENT_CLIENT_SPREADS,
  RECENT_CLIENT_DOMINANT_SUITS,
};
export type { RecentClientReadingType };

/** Tarot numerology keys used across the knowledge graph (pip 1–10, courts 11–14, majors 0–21). */
export const TAROT_NUMEROLOGY_NUMBERS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
] as const;

export type TarotNumerologyNumber = (typeof TAROT_NUMEROLOGY_NUMBERS)[number];

/** Maps dominant-suit labels to repeating-card collection suit folders. */
export const DOMINANT_SUIT_TO_FOLDER: Partial<
  Record<(typeof RECENT_CLIENT_DOMINANT_SUITS)[number], RepeatingCardSuitFolder>
> = {
  Cups: "cups",
  Wands: "wands",
  Swords: "swords",
  Pentacles: "pentacles",
  "Major Arcana": "majors",
};

export const SUIT_FOLDER_TO_LABEL: Record<RepeatingCardSuitFolder, string> = {
  majors: "Major Arcana",
  cups: "Cups",
  swords: "Swords",
  wands: "Wands",
  pentacles: "Pentacles",
};
