import type { CollectionEntry } from "astro:content";

type RepeatingCardEntry = CollectionEntry<"repeatingCardMeanings">;

export type RepeatingCardQuestionItem = {
  question: string;
  answer: string;
};

export type RepeatingCardQuestionsModel = {
  items: RepeatingCardQuestionItem[];
  usedOptionalThird: boolean;
};

const QUERY_LEAD = /^(why|how|what|when|where|can|does|do|is|are|should)\b/i;

const GENERIC_KEYWORD =
  /^(why does (the )?.+ keep (showing up|appearing)|.+ repeating tarot meaning|.+ pattern in tarot readings)$/i;

const LIFE_AREA_RULES: {
  pattern: RegExp;
  topic: string;
  answerField: "featuredSnippetAnswer" | "answerEngineSummary";
}[] = [
  {
    pattern: /\b(love|relationship|romance|new relationship)\b/i,
    topic: "love and relationships",
    answerField: "featuredSnippetAnswer",
  },
  {
    pattern: /\b(career|work|vocation|purpose|job)\b/i,
    topic: "career and purpose",
    answerField: "answerEngineSummary",
  },
  {
    pattern: /\b(money|wealth|financial|material|stability)\b/i,
    topic: "money and material stability",
    answerField: "answerEngineSummary",
  },
  {
    pattern: /\b(spiritual|spirituality|soul)\b/i,
    topic: "spiritual growth",
    answerField: "answerEngineSummary",
  },
  {
    pattern: /\b(shadow|integrated|integration)\b/i,
    topic: "shadow and integration",
    answerField: "answerEngineSummary",
  },
];

function cleanText(value: string): string {
  return value.replace(/\s*\u2014\s*/g, " - ").replace(/  +/g, " ").trim();
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? cleanText(trimmed) : null;
}

function normalizeCompare(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function isGenericSecondaryKeyword(keyword: string): boolean {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized || GENERIC_KEYWORD.test(normalized)) return true;
  if (/repeating tarot meaning$/i.test(normalized)) return true;
  if (/pattern in tarot readings?$/i.test(normalized)) return true;
  if (/^why does (the )?.+ keep (showing up|appearing)/i.test(normalized)) return true;
  return false;
}

function questionOne(displayTitle: string): string {
  return `What does it mean when ${displayTitle} keeps appearing?`;
}

function questionTwo(displayTitle: string): string {
  return `What is the deeper pattern behind repeating ${displayTitle}?`;
}

function formatQueryQuestion(keyword: string): string {
  const trimmed = keyword.trim();
  if (trimmed.endsWith("?")) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  if (QUERY_LEAD.test(trimmed)) {
    return `${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}?`;
  }
  return `${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}?`;
}

function lifeAreaQuestion(displayTitle: string, topic: string): string {
  return `What does a repeating ${displayTitle} mean for ${topic}?`;
}

function pickDistinctQueryKeyword(
  keywords: string[],
  displayTitle: string,
  primaryKeyword: string | null,
): string | null {
  const q1Norm = normalizeCompare(questionOne(displayTitle));

  for (const raw of keywords) {
    const keyword = raw.trim();
    if (!keyword || isGenericSecondaryKeyword(keyword)) continue;

    const isQuery =
      QUERY_LEAD.test(keyword) ||
      /\b(every week|every month|each week|each reading|in love|for career|for money)\b/i.test(
        keyword,
      );

    if (!isQuery) continue;

    if (primaryKeyword && normalizeCompare(keyword) === normalizeCompare(primaryKeyword)) {
      continue;
    }

    const formatted = formatQueryQuestion(keyword);
    if (normalizeCompare(formatted) === q1Norm) continue;

    return keyword;
  }

  return null;
}

function pickLifeAreaKeyword(
  keywords: string[],
  displayTitle: string,
): { keyword: string; topic: string; answerField: "featuredSnippetAnswer" | "answerEngineSummary" } | null {
  for (const raw of keywords) {
    const keyword = raw.trim();
    if (!keyword || isGenericSecondaryKeyword(keyword)) continue;
    if (QUERY_LEAD.test(keyword)) continue;

    for (const rule of LIFE_AREA_RULES) {
      if (!rule.pattern.test(keyword)) continue;
      return { keyword, topic: rule.topic, answerField: rule.answerField };
    }
  }

  return null;
}

function pickOptionalThird(
  entry: RepeatingCardEntry,
  displayTitle: string,
  featured: string,
  summary: string,
): RepeatingCardQuestionItem | null {
  const keywords = entry.data.secondaryKeywords ?? [];
  const primary = nonEmpty(entry.data.primaryKeyword);

  const queryKeyword = pickDistinctQueryKeyword(keywords, displayTitle, primary);
  if (queryKeyword) {
    const temporal = /\b(every week|every month|each week|weekly|monthly)\b/i.test(queryKeyword);
    const answer = temporal ? featured : summary;
    return {
      question: formatQueryQuestion(queryKeyword),
      answer,
    };
  }

  const lifeArea = pickLifeAreaKeyword(keywords, displayTitle);
  if (lifeArea) {
    const answer =
      lifeArea.answerField === "featuredSnippetAnswer" ? featured : summary;
    return {
      question: lifeAreaQuestion(displayTitle, lifeArea.topic),
      answer,
    };
  }

  return null;
}

/** Build governed visible Q&A from frontmatter (entity pages only). */
export function buildRepeatingCardQuestions(
  entry: RepeatingCardEntry,
  displayTitle: string,
): RepeatingCardQuestionsModel | null {
  const featured = nonEmpty(entry.data.featuredSnippetAnswer);
  const summary = nonEmpty(entry.data.answerEngineSummary);

  if (!featured || !summary) return null;

  const items: RepeatingCardQuestionItem[] = [
    { question: questionOne(displayTitle), answer: featured },
    { question: questionTwo(displayTitle), answer: summary },
  ];

  const third = pickOptionalThird(entry, displayTitle, featured, summary);
  let usedOptionalThird = false;

  if (third) {
    const duplicateAnswer = items.some(
      (item) => normalizeCompare(item.answer) === normalizeCompare(third.answer),
    );
    const duplicateQuestion = items.some(
      (item) => normalizeCompare(item.question) === normalizeCompare(third.question),
    );

    if (!duplicateAnswer && !duplicateQuestion) {
      items.push(third);
      usedOptionalThird = true;
    }
  }

  return { items, usedOptionalThird };
}
