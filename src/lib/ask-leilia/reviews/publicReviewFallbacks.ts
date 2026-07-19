import type { AskLeiliaPublicReview } from "./types";

/**
 * Published public-review projection for local development and tests when the
 * live query is unavailable (e.g. no Supabase service role) or returns no rows.
 *
 * Must not be substituted silently in production. Verification flags mirror the
 * intended public projection; production still uses live `verification_status`
 * (Sasha’s DB correction remains in the pending migration).
 */
export const ASK_LEILIA_PUBLIC_REVIEW_FALLBACKS: AskLeiliaPublicReview[] = [
  {
    id: "00fe28a7-452a-429d-8adc-edcee721e1b3",
    display_name: "Hannah Ruhamah",
    reading_type: "one-question",
    reading_type_label: "One Question Reading",
    rating: 5,
    title: "The Power of Less",
    body: "Leilia offered a thoughtful, nuanced, and beautifully presented reading. What impressed me most was how clearly she identified the central themes surrounding my rebrand despite having far less context than she might have received during an in-person session. Her interpretation felt specific to both the question and the imagery of the cards, rather than broad or generic.\n\nShe wove together the individual cards, repeated numbers, visual details, and overall structure of the spread into a coherent narrative about discernment, refinement, value, and intentional growth. I especially appreciated that she did not simply predict success or difficulty. She translated the cards into practical guidance I could genuinely apply to my branding, messaging, and use of resources.\n\nHer insight that “the potency lies in the reduction” was particularly resonant and gave me a clear lens through which to evaluate the rebrand. The reading felt grounded, encouraging, and actionable while still leaving room for my own intuition and interpretation. Overall, I felt Leilia did an excellent job of understanding the deeper energy of the project and communicating it with care, intelligence, and clarity.",
    is_verified: true,
    published_month_year: "July 2026",
  },
  {
    id: "b071db83-f330-4f64-a54f-c397f6109923",
    display_name: "Sasha",
    reading_type: "one-question",
    reading_type_label: "One Question Reading",
    rating: 5,
    title: "A great choice",
    body: "The reading I received was deeply insightful and provided sound advice on the issue I was facing. The way it was delivered made me feel seen and supported, I really enjoyed the interaction throughout. Ended up following the advice that was given to me in that reading and I don't regret it. Highly recommend 😊",
    // Local/dev fallback only. Production badge remains driven by live verification_status
    // (pending migration 20260719000000_ask_leilia_sasha_review_verification.sql).
    is_verified: true,
    published_month_year: "July 2026",
  },
  {
    id: "8b814f07-f644-40b8-b5e4-f4242e6b4dd0",
    display_name: "Joyce",
    reading_type: "in-depth",
    reading_type_label: "In-Depth Reading",
    rating: 5,
    title: "OMGOSH 💚 Just Perfect",
    body: "My reading was so in-depth. This wasnt just surface level stuff, it was a deep dive into the divine, the cosmos, and more. I loved how everything was set up to show multiple views of the cards and from different angles. It was simply perfect 🥰",
    is_verified: true,
    published_month_year: "July 2026",
  },
  {
    id: "c5e1f8a0-0712-4111-8b25-00a5c1e11003",
    display_name: "Anonymous",
    reading_type: "one-question",
    reading_type_label: "One Question Reading",
    rating: 5,
    title: "A beautiful interpretation",
    body: "This was such a beautiful interpretation. It made sense immediately, and I especially appreciated the way Leilia explained how she was reading the cards, not just the conclusion she reached.",
    is_verified: true,
    published_month_year: "July 2026",
  },
  {
    id: "c5e1f8a0-0708-4111-8b25-00a5c1e11001",
    display_name: "Celia",
    reading_type: "one-question",
    reading_type_label: "One Question Reading",
    rating: 5,
    title: "Clearer than my own perspective",
    body: "Leilia helped me step back from my own emotional bias and see the situation more clearly. Her interpretation was thoughtful, balanced and genuinely useful, especially because I tend to view my own readings more negatively.",
    is_verified: true,
    published_month_year: "July 2026",
  },
  {
    id: "c5e1f8a0-0710-4111-8b25-00a5c1e11002",
    display_name: "Anonymous",
    reading_type: "one-question",
    reading_type_label: "One Question Reading",
    rating: 5,
    title: "Insightful and easy to understand",
    body: "I loved Leilia’s interpretation. It was insightful, thoughtful and gave me a fresh way to understand both the cards and the situation.",
    is_verified: true,
    published_month_year: "July 2026",
  },
];
