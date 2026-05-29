/** Strip HTML tags and collapse whitespace for JSON-LD Answer text. */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type FaqItemInput = {
  question: string;
  answerHtml: string;
};

/** FAQPage JSON-LD from visible FAQ items (plain-text answers only). */
export function faqPageJsonLd(
  items: FaqItemInput[],
  pageUrl: string,
): Record<string, unknown> {
  const mainEntity = items
    .map((item) => {
      const question = item.question.trim();
      const text = stripHtmlToPlainText(item.answerHtml);
      if (!question || !text) return null;
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text,
        },
      };
    })
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity,
  };
}
