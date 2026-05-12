import type { CompassTrainingPage } from "./types";

/** Mexico City (from August 2026) — source: docs/copy/compass-training-page-copy-mexico.md — not published until switched in active-training. */
export const compassTrainingMexico: CompassTrainingPage = {
  id: "mexico",
  meta: {
    title: "COMPASS Training: Build Intuition. Work Live.",
    description:
      "A 4-week live training programme for tarot and oracle readers. Small cohorts, direct founder access, and real practice inside The Deck Compass platform.",
  },
  hero: {
    eyebrow: "4-week live programme",
    heading: "COMPASS Training: Build Intuition. Work Live.",
    paragraphs: [
      "You already know the cards. That is not the problem.",
      "The problem is what happens when you are in the middle of a reading. You see something, then hesitate. You feel a clear thread, then second-guess it. You start explaining instead of interpreting. You reach for meanings instead of staying with what is actually unfolding.",
      "COMPASS training is where that changes.",
    ],
  },
  trainingPractice: {
    heading: "Training and practice are not the same thing",
    paragraphs: [
      "Training installs the method. Practice stabilises it.",
      "The COMPASS programme is where the framework is taught directly. The Deck Compass is where repeated live practice and reflection help the habits take root.",
      "Students complete training and move directly into The Deck Compass with three months of platform access included at every tier.",
    ],
  },
  problemFit: {
    label: "Problem fit",
    heading: "If This Sounds Like You",
    bullets: [
      "You know the meanings, but your readings still feel uncertain",
      "You start strong, then lose the thread halfway through",
      "You over-explain instead of saying what you actually see",
      "You feel intuitive hits, then immediately doubt them",
      "You keep looking for the right meaning instead of trusting your read",
      "You finish readings and think: that wasn't as clear as it should have been",
    ],
  },
  method: {
    label: "Method",
    heading: "The COMPASS Method™",
    pillars: [
      "Center",
      "Open",
      "Map",
      "Perceive",
      "Align",
      "Sense",
      "Seal",
    ],
    paragraphs: [
      "This is not about learning more tarot. It is about learning how to read.",
      "The COMPASS Method™ is an original interpretive framework created by Tides of Knowing.",
    ],
  },
  learningOutcomes: {
    label: "Learning outcomes",
    heading: "What You Will Learn",
    intro:
      "Most tarot training focuses on what the cards mean. COMPASS focuses on what the reader is doing.",
    bullets: [
      "Trust your own perception in a reading",
      "Stay with what is actually unfolding",
      "Communicate what you see clearly and cleanly",
    ],
  },
  howItWorks: {
    label: "Process",
    heading: "How It Works",
    intro: "This is a 4-week live programme for a small cohort of readers.",
    bullets: [
      "Weeks one and two: the COMPASS Method and the seven conditions of attention, taught in alternate-day sessions",
      "Weeks three and four: live practice and guided integration inside The Deck Compass platform",
      "Maximum six participants per cohort",
      "Minimum two participants to run",
      "Live only, not replay-based",
    ],
    closingParagraphs: [
      "You are asked to apply because fit matters. This is a small programme where direct feedback and outcome matter more than filling places.",
    ],
  },
  cohortSchedule: {
    variant: "mexico",
    label: "Cohort schedule",
    heading: "When Cohorts Run",
    introParagraphs: [
      "New cohorts open at the beginning of each month. The programme is based in Mexico City (CST, UTC−6) and sessions are offered across two daily windows to serve readers in the UK, Europe, and across North America.",
    ],
    morning: {
      title: "Morning sessions",
      headers: ["Mexico City", "UK / Ireland", "US East", "US Central", "US West"],
      rows: [
        ["8:00am", "2:00pm", "9:00am", "8:00am", "6:00am"],
        ["9:00am", "3:00pm", "10:00am", "9:00am", "7:00am"],
        ["10:00am", "4:00pm", "11:00am", "10:00am", "8:00am"],
        ["11:00am", "5:00pm", "12:00pm", "11:00am", "9:00am"],
      ],
      note: "8am–11am Mexico City time (CST). This is the primary window for UK and Irish readers (afternoon their time) and US East and Central morning sessions.",
    },
    afternoon: {
      title: "Afternoon sessions",
      headers: ["Mexico City", "UK / Ireland", "US East", "US Central", "US West"],
      rows: [
        ["4:00pm", "10:00pm", "5:00pm", "4:00pm", "2:00pm"],
        ["5:00pm", "11:00pm", "6:00pm", "5:00pm", "3:00pm"],
        ["6:00pm", "midnight", "7:00pm", "6:00pm", "4:00pm"],
        ["7:00pm", "1:00am", "8:00pm", "7:00pm", "5:00pm"],
      ],
      note: "4pm–7pm Mexico City time (CST). This is the primary window for US East, Central, and West Coast readers (after-work hours). UK readers are not served by the afternoon window.",
    },
    whichWindowHeading: "Which window is right for you",
    whichWindowLines: [
      {
        lead: "UK and Ireland:",
        detail: "morning window only (8am–11am CST / 2pm–5pm your time)",
      },
      {
        lead: "US East and Central:",
        detail: "either window works; most choose afternoon",
      },
      {
        lead: "US West Coast:",
        detail: "afternoon window (2pm–5pm your time)",
      },
      {
        lead: "Canada:",
        detail: "follows the same pattern as the equivalent US time zone",
      },
      {
        lead: "Australia and New Zealand:",
        detail:
          'not served by current cohort windows for live sessions; <a class="compass__faq-link" href="/contact/">Register interest</a> in future scheduling',
      },
    ],
    closingParagraph:
      "You will indicate your preferred window in your application. Sessions are confirmed once the cohort is formed.",
    timezoneNoteAfterTables:
      "Local equivalents may shift during seasonal clock changes in the UK and US. Confirmed session times are provided during enrolment.",
  },
  investment: {
    label: "Investment",
    heading: "Investment",
    intro: "Three ways to join, depending on how much direct support you want.",
    tiers: [
      {
        title: "Course · USD $697",
        body: [
          "Four weeks of live COMPASS training. Full platform onboarding to The Deck Compass. Three months of platform access included.",
        ],
      },
      {
        title: "Course + Mentor Access · USD $997",
        body: [
          "Everything in Course, plus three observer sessions during your free platform period.",
          "During an observer session, I join your live reading environment and watch you work with a real client. Afterwards I provide direct written or voice feedback. You choose when to invoke these sessions by booking through an open calendar. Sessions do not roll over.",
          "This tier is for the reader who wants direct eyes on their practice, not just the method.",
        ],
      },
      {
        title: "Course + Ongoing Mentorship · USD $1,497",
        body: [
          "Everything in Course + Mentor Access, plus one observer session per month for six months after the programme ends.",
          "This is for the reader who is actively building a client practice and wants sustained development support over the period when new habits are being formed and tested in real readings.",
        ],
      },
    ],
    afterHeading: "After the three months",
    afterParagraphs: [
      "All tiers include three months of The Deck Compass at no additional cost.",
      "After that, platform access continues at USD $39 per month.",
    ],
  },
  about: {
    label: "Authority",
    heading: "About Leigh Spencer",
    paragraphs: [
      "I have been reading tarot and oracle cards for over 40 years. Before that, I spent 30 years as a journalist, broadcaster, and editor, trained to observe, interpret, and communicate clearly.",
      "COMPASS is built from real reading experience, and from seeing exactly where readers lose trust in themselves.",
    ],
  },
  faq: {
    label: "FAQ",
    heading: "Common Questions",
    items: [
      {
        q: "What level do I need to be at?",
        a: "You should already be reading tarot or oracle cards and understand the basics. This work is about improving how you read, not learning meanings from scratch.",
      },
      {
        q: "How is this delivered?",
        a: "COMPASS is a small, live programme with alternate-day sessions across four weeks, guided practice, and direct feedback. It is not pre-recorded or self-paced.",
      },
      {
        q: "What if I am not confident yet?",
        a: "That is exactly what this is designed for. The focus is on helping you trust what you are seeing and communicate it clearly, not on performing or being right.",
      },
      {
        q: "What is The Deck Compass?",
        a: "The Deck Compass is the practice platform built specifically around the COMPASS Method. It is where you log readings, work with reflection prompts, and build the habit of structured intuitive practice over time. Training gives you the method. The Deck Compass gives you the environment to make it stick.",
      },
      {
        q: "What does a mentor observer session involve?",
        a: "I join your live reading environment and observe a session with a real client. Afterwards I provide written or voice feedback directly. You book these via open calendar at a time that suits both you and your client. Observer sessions are available to Mentor Access and Ongoing Mentorship tier students only.",
      },
      {
        q: "I am in the UK. Which window should I choose?",
        a: "The morning window is your only viable option for live sessions. Your sessions will fall between 2pm and 5pm UK time, which suits most self-employed readers. Please select the morning window in your application.",
      },
      {
        q: "I am on the US West Coast. Can I join?",
        a: "Yes. The afternoon window places your sessions between 2pm and 5pm Pacific Time, which works well for most readers. Select the afternoon window in your application.",
      },
      {
        q: "I am in Australia or New Zealand. Can I join?",
        a: "Current cohort windows do not serve Australasia for live sessions. If you would like to be notified if a suitable window becomes available, you are welcome to register your interest using the application form.",
      },
      {
        q: "When do cohorts run?",
        a: "Monthly, with weekly cohorts introduced as demand grows. Apply now to be considered for the next available cohort.",
      },
      {
        q: "What happens after I apply?",
        a: "I review each application to ensure the group is aligned. If it is a good fit, you will receive a payment link to secure your place.",
      },
      {
        q: "What if I am unsure?",
        a: 'You are welcome to <a class="compass__faq-link" href="/contact/">reach out</a> before applying if you want to check whether it is right for you.',
      },
    ],
  },
  apply: {
    label: "Apply",
    heading: "Apply",
    intro: "Send a short message with:",
    checklist: [
      "Your experience level with tarot or oracle cards",
      "What is not working in your readings right now",
      "Which tier you are interested in",
      "Your location and preferred session window (morning or afternoon, Mexico City time)",
    ],
    note: "If accepted, your place will be held for 48 hours.",
    ctaLabel: "Apply Now",
    ctaHref: "/compass/apply/",
  },
  footerAttribution:
    "The COMPASS Method™ is an original interpretive framework created by Tides of Knowing.",
};
