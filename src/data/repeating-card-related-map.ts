/**
 * Governed related-card relationships for canonical entity pages.
 * Source of truth: `src/data/related-card-map.yaml`
 * Regenerate: `node scripts/generate-repeating-card-related-map.mjs`
 */

export type RepeatingCardRelationshipType =
  | "same-theme"
  | "progressive"
  | "shadow-pair"
  | "suit-companion"
  | "archetypal-mirror"
  | "resolving-pair";

export type RepeatingCardRelatedRef = {
  card: string;
  relationship_type: RepeatingCardRelationshipType;
};

export const REPEATING_CARD_RELATED_MAP: Record<string, RepeatingCardRelatedRef[]> =
{
  "majors/the-fool": [
    {
      "card": "majors/the-world",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/ace-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/ace-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "shadow-pair"
    }
  ],
  "majors/the-magician": [
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/strength",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/nine-of-cups",
      "relationship_type": "resolving-pair"
    }
  ],
  "majors/the-high-priestess": [
    {
      "card": "majors/the-magician",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/four-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-empress": [
    {
      "card": "majors/the-emperor",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/queen-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/queen-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/six-of-pentacles",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-emperor": [
    {
      "card": "majors/the-empress",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "wands/king-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/king-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/four-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "progressive"
    }
  ],
  "majors/the-hierophant": [
    {
      "card": "majors/the-emperor",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/six-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/justice",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-devil",
      "relationship_type": "shadow-pair"
    }
  ],
  "majors/the-lovers": [
    {
      "card": "cups/two-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "cups/four-of-cups",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "progressive"
    }
  ],
  "majors/the-chariot": [
    {
      "card": "majors/the-lovers",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/strength",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/two-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/seven-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/knight-of-wands",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "majors/strength": [
    {
      "card": "majors/the-chariot",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "majors/wheel-of-fortune",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "majors/the-hermit": [
    {
      "card": "majors/strength",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/four-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hanged-man",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "majors/wheel-of-fortune": [
    {
      "card": "majors/the-world",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hanged-man",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "wands/ten-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/death",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "resolving-pair"
    }
  ],
  "majors/justice": [
    {
      "card": "majors/the-hierophant",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/judgement",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/two-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/queen-of-swords",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "majors/the-hanged-man": [
    {
      "card": "majors/the-hermit",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/wheel-of-fortune",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "swords/four-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/death",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "majors/death": [
    {
      "card": "majors/the-hanged-man",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/judgement",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/six-of-swords",
      "relationship_type": "same-theme"
    }
  ],
  "majors/temperance": [
    {
      "card": "majors/the-devil",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "pentacles/two-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-lovers",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-devil": [
    {
      "card": "majors/the-tower",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/temperance",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "pentacles/four-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/eight-of-swords",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-tower": [
    {
      "card": "majors/the-devil",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/death",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/ten-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "shadow-pair"
    }
  ],
  "majors/the-star": [
    {
      "card": "majors/the-tower",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/temperance",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "cups/ace-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-moon": [
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-sun",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/nine-of-swords",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-sun": [
    {
      "card": "majors/the-moon",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/judgement",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/nine-of-cups",
      "relationship_type": "resolving-pair"
    }
  ],
  "majors/judgement": [
    {
      "card": "majors/the-sun",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/death",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/ten-of-swords",
      "relationship_type": "same-theme"
    }
  ],
  "majors/the-world": [
    {
      "card": "majors/the-fool",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/judgement",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-sun",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "resolving-pair"
    }
  ],
  "cups/ace-of-cups": [
    {
      "card": "cups/two-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-fool",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/page-of-cups",
      "relationship_type": "suit-companion"
    },
    {
      "card": "majors/strength",
      "relationship_type": "same-theme"
    }
  ],
  "cups/two-of-cups": [
    {
      "card": "cups/ace-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-lovers",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/three-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/six-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "progressive"
    }
  ],
  "cups/three-of-cups": [
    {
      "card": "cups/two-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/four-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/six-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    }
  ],
  "cups/four-of-cups": [
    {
      "card": "cups/three-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/five-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "cups/five-of-cups": [
    {
      "card": "cups/four-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/six-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/three-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    }
  ],
  "cups/six-of-cups": [
    {
      "card": "cups/five-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/two-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/four-of-cups",
      "relationship_type": "shadow-pair"
    }
  ],
  "cups/seven-of-cups": [
    {
      "card": "cups/four-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/two-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-lovers",
      "relationship_type": "same-theme"
    }
  ],
  "cups/eight-of-cups": [
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/nine-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/five-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/death",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hanged-man",
      "relationship_type": "same-theme"
    }
  ],
  "cups/nine-of-cups": [
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-sun",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "same-theme"
    }
  ],
  "cups/ten-of-cups": [
    {
      "card": "cups/nine-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/two-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    }
  ],
  "cups/page-of-cups": [
    {
      "card": "cups/ace-of-cups",
      "relationship_type": "suit-companion"
    },
    {
      "card": "cups/knight-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/two-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/page-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/page-of-pentacles",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "cups/knight-of-cups": [
    {
      "card": "cups/page-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/queen-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/two-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/knight-of-wands",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "cups/queen-of-cups": [
    {
      "card": "cups/king-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "cups/knight-of-cups",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/queen-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "cups/six-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "cups/king-of-cups": [
    {
      "card": "cups/queen-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/king-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "cups/nine-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/strength",
      "relationship_type": "same-theme"
    }
  ],
  "wands/ace-of-wands": [
    {
      "card": "wands/two-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-fool",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/page-of-wands",
      "relationship_type": "suit-companion"
    },
    {
      "card": "wands/eight-of-wands",
      "relationship_type": "same-theme"
    }
  ],
  "wands/two-of-wands": [
    {
      "card": "wands/ace-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/three-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-lovers",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/seven-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "wands/three-of-wands": [
    {
      "card": "wands/two-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/four-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/seven-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/eight-of-wands",
      "relationship_type": "progressive"
    }
  ],
  "wands/four-of-wands": [
    {
      "card": "wands/three-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/five-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/ten-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    }
  ],
  "wands/five-of-wands": [
    {
      "card": "wands/four-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/seven-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/five-of-swords",
      "relationship_type": "same-theme"
    }
  ],
  "wands/six-of-wands": [
    {
      "card": "wands/five-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/seven-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-sun",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/king-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/three-of-pentacles",
      "relationship_type": "same-theme"
    }
  ],
  "wands/seven-of-wands": [
    {
      "card": "wands/six-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/eight-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/five-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    }
  ],
  "wands/eight-of-wands": [
    {
      "card": "wands/seven-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/ace-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/three-of-wands",
      "relationship_type": "progressive"
    }
  ],
  "wands/nine-of-wands": [
    {
      "card": "wands/eight-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/ten-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/strength",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/seven-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/four-of-swords",
      "relationship_type": "resolving-pair"
    }
  ],
  "wands/ten-of-wands": [
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "majors/the-devil",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/ten-of-swords",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "pentacles/six-of-pentacles",
      "relationship_type": "same-theme"
    }
  ],
  "wands/page-of-wands": [
    {
      "card": "wands/ace-of-wands",
      "relationship_type": "suit-companion"
    },
    {
      "card": "wands/knight-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/page-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "swords/page-of-swords",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-fool",
      "relationship_type": "same-theme"
    }
  ],
  "wands/knight-of-wands": [
    {
      "card": "wands/page-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/queen-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/knight-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "swords/knight-of-swords",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    }
  ],
  "wands/queen-of-wands": [
    {
      "card": "wands/king-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "wands/knight-of-wands",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/queen-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "same-theme"
    }
  ],
  "wands/king-of-wands": [
    {
      "card": "wands/queen-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/king-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "progressive"
    }
  ],
  "swords/ace-of-swords": [
    {
      "card": "swords/two-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/justice",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/page-of-swords",
      "relationship_type": "suit-companion"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    }
  ],
  "swords/two-of-swords": [
    {
      "card": "swords/ace-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/three-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-lovers",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/eight-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/four-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "swords/three-of-swords": [
    {
      "card": "swords/two-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/four-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/five-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/ten-of-swords",
      "relationship_type": "progressive"
    }
  ],
  "swords/four-of-swords": [
    {
      "card": "swords/three-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/five-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/nine-of-wands",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "majors/the-hanged-man",
      "relationship_type": "same-theme"
    }
  ],
  "swords/five-of-swords": [
    {
      "card": "swords/four-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/six-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/seven-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-devil",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/five-of-wands",
      "relationship_type": "same-theme"
    }
  ],
  "swords/six-of-swords": [
    {
      "card": "swords/five-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/seven-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/eight-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/death",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-star",
      "relationship_type": "resolving-pair"
    }
  ],
  "swords/seven-of-swords": [
    {
      "card": "swords/six-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/eight-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/five-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "shadow-pair"
    }
  ],
  "swords/eight-of-swords": [
    {
      "card": "swords/seven-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/nine-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/two-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-devil",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "same-theme"
    }
  ],
  "swords/nine-of-swords": [
    {
      "card": "swords/eight-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/ten-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-moon",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/four-of-swords",
      "relationship_type": "resolving-pair"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    }
  ],
  "swords/ten-of-swords": [
    {
      "card": "swords/nine-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/judgement",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/death",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/ace-of-swords",
      "relationship_type": "resolving-pair"
    }
  ],
  "swords/page-of-swords": [
    {
      "card": "swords/ace-of-swords",
      "relationship_type": "suit-companion"
    },
    {
      "card": "swords/knight-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/page-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/page-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "same-theme"
    }
  ],
  "swords/knight-of-swords": [
    {
      "card": "swords/page-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "swords/queen-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/knight-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/knight-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    }
  ],
  "swords/queen-of-swords": [
    {
      "card": "swords/king-of-swords",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "swords/knight-of-swords",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/justice",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-high-priestess",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/queen-of-cups",
      "relationship_type": "archetypal-mirror"
    }
  ],
  "swords/king-of-swords": [
    {
      "card": "swords/queen-of-swords",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/justice",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/king-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/ace-of-pentacles": [
    {
      "card": "pentacles/two-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/page-of-pentacles",
      "relationship_type": "suit-companion"
    },
    {
      "card": "wands/ace-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-magician",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/two-of-pentacles": [
    {
      "card": "pentacles/ace-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/three-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/two-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/ten-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-chariot",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/three-of-pentacles": [
    {
      "card": "pentacles/two-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/four-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/eight-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/six-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/four-of-pentacles": [
    {
      "card": "pentacles/three-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/five-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-devil",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "shadow-pair"
    }
  ],
  "pentacles/five-of-pentacles": [
    {
      "card": "pentacles/four-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/six-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-tower",
      "relationship_type": "same-theme"
    },
    {
      "card": "swords/three-of-swords",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "resolving-pair"
    }
  ],
  "pentacles/six-of-pentacles": [
    {
      "card": "pentacles/five-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/seven-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/three-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/two-of-cups",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/seven-of-pentacles": [
    {
      "card": "pentacles/six-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/eight-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "wands/three-of-wands",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "progressive"
    }
  ],
  "pentacles/eight-of-pentacles": [
    {
      "card": "pentacles/seven-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/three-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/knight-of-pentacles",
      "relationship_type": "suit-companion"
    }
  ],
  "pentacles/nine-of-pentacles": [
    {
      "card": "pentacles/eight-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hermit",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/four-of-pentacles",
      "relationship_type": "shadow-pair"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/ten-of-pentacles": [
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-hierophant",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/six-of-cups",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "majors/the-world",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/page-of-pentacles": [
    {
      "card": "pentacles/ace-of-pentacles",
      "relationship_type": "suit-companion"
    },
    {
      "card": "pentacles/knight-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "cups/page-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/three-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/eight-of-pentacles",
      "relationship_type": "progressive"
    }
  ],
  "pentacles/knight-of-pentacles": [
    {
      "card": "pentacles/page-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/queen-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "pentacles/eight-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/knight-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "wands/ten-of-wands",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/queen-of-pentacles": [
    {
      "card": "pentacles/king-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/knight-of-pentacles",
      "relationship_type": "progressive"
    },
    {
      "card": "majors/the-empress",
      "relationship_type": "same-theme"
    },
    {
      "card": "cups/queen-of-cups",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "same-theme"
    }
  ],
  "pentacles/king-of-pentacles": [
    {
      "card": "pentacles/queen-of-pentacles",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "majors/the-emperor",
      "relationship_type": "same-theme"
    },
    {
      "card": "wands/king-of-wands",
      "relationship_type": "archetypal-mirror"
    },
    {
      "card": "pentacles/ten-of-pentacles",
      "relationship_type": "same-theme"
    },
    {
      "card": "pentacles/nine-of-pentacles",
      "relationship_type": "progressive"
    }
  ]
};
