import { tarotCardsNew } from "../src/data/tarotCardsNew.js";

/** Exact card1|card2 pairings (both directions) from prior session validation outputs */
const EXCLUDED_PAIR_KEYS = new Set([
  "Ten of Pentacles|Strength",
  "Strength|Ten of Pentacles",
  "The Emperor|Five of Pentacles",
  "Five of Pentacles|The Emperor",
  "The Sun|Three of Swords",
  "Three of Swords|The Sun",
  "Two of Pentacles|Death",
  "Death|Two of Pentacles",
  "The Devil|Ace of Cups",
  "Ace of Cups|The Devil",
  "Justice|Nine of Pentacles",
  "Nine of Pentacles|Justice",
  "Three of Wands|The Star",
  "The Star|Three of Wands",
  "Three of Pentacles|The Emperor",
  "The Emperor|Three of Pentacles",
  "King of Pentacles|The Devil",
  "The Devil|King of Pentacles",
  "Eight of Swords|Death",
  "Death|Eight of Swords",
  "The Hierophant|Two of Wands",
  "Two of Wands|The Hierophant",
  "Temperance|Seven of Pentacles",
  "Seven of Pentacles|Temperance",
  "Five of Swords|Judgement",
  "Judgement|Five of Swords",
  "The Chariot|Four of Wands",
  "Four of Wands|The Chariot",
  "The High Priestess|Knight of Wands",
  "Knight of Wands|The High Priestess",
  "Four of Pentacles|Six of Wands",
  "Six of Wands|Four of Pentacles",
  "Page of Wands|Eight of Cups",
  "Eight of Cups|Page of Wands",
  "The Hanged Man|Page of Pentacles",
  "Page of Pentacles|The Hanged Man",
  "Queen of Pentacles|The Hermit",
  "The Hermit|Queen of Pentacles",
  "The Tower|Two of Cups",
  "Two of Cups|The Tower",
  "King of Cups|Seven of Swords",
  "Seven of Swords|King of Cups",
  "Six of Pentacles|Five of Wands",
  "Five of Wands|Six of Pentacles",
  "The Lovers|Queen of Wands",
  "Queen of Wands|The Lovers",
  "Six of Swords|The Empress",
  "The Empress|Six of Swords",
  "Wheel of Fortune|Nine of Wands",
  "Nine of Wands|Wheel of Fortune",
  "Eight of Wands|Seven of Wands",
  "Seven of Wands|Eight of Wands",
  "Queen of Cups|Seven of Swords",
  "Seven of Swords|Queen of Cups",
  "Wheel of Fortune|Queen of Wands",
  "Queen of Wands|Wheel of Fortune",
  "Nine of Cups|The Magician",
  "The Magician|Nine of Cups",
  "The Empress|Ten of Wands",
  "Ten of Wands|The Empress",
  "Seven of Swords|Five of Wands",
  "Five of Wands|Seven of Swords",
  "Page of Swords|Nine of Swords",
  "Nine of Swords|Page of Swords",
  "The Lovers|Knight of Pentacles",
  "Knight of Pentacles|The Lovers",
  "Page of Cups|The Empress",
  "The Empress|Page of Cups",
  "Wheel of Fortune|Ace of Wands",
  "Ace of Wands|Wheel of Fortune",
  "Ace of Pentacles|Ten of Wands",
  "Ten of Wands|Ace of Pentacles",
  "Three of Cups|Page of Swords",
  "Page of Swords|Three of Cups",
  "Wheel of Fortune|King of Wands",
  "King of Wands|Wheel of Fortune",
  "Seven of Swords|The Magician",
  "The Magician|Seven of Swords",
  "The Empress|Five of Wands",
  "Five of Wands|The Empress",
  "Six of Cups|Five of Pentacles",
  "Five of Pentacles|Six of Cups",
  "Six of Pentacles|Two of Wands",
  "Two of Wands|Six of Pentacles",
  "Temperance|Seven of Swords",
  "Seven of Swords|Temperance",
  "The Hierophant|King of Swords",
  "King of Swords|The Hierophant",
  "Two of Wands|Strength",
  "Strength|Two of Wands",
  "Eight of Cups|Four of Pentacles",
  "Four of Pentacles|Eight of Cups",
  "Eight of Cups|Three of Wands",
  "Three of Wands|Eight of Cups",
  "Six of Pentacles|Seven of Pentacles",
  "Seven of Pentacles|Six of Pentacles",
  "Two of Cups|Seven of Swords",
  "Seven of Swords|Two of Cups",
  "Six of Pentacles|The Fool",
  "The Fool|Six of Pentacles",
  "Seven of Cups|Four of Pentacles",
  "Four of Pentacles|Seven of Cups",
  "Three of Pentacles|King of Pentacles",
  "King of Pentacles|Three of Pentacles",
  "Five of Cups|Queen of Wands",
  "Queen of Wands|Five of Cups",
  "The Hierophant|The Empress",
  "The Empress|The Hierophant",
  "Five of Cups|Justice",
  "Justice|Five of Cups",
  "Six of Pentacles|Page of Pentacles",
  "Page of Pentacles|Six of Pentacles",
  "Eight of Pentacles|Knight of Wands",
  "Knight of Wands|Eight of Pentacles",
  "Two of Wands|Four of Swords",
  "Four of Swords|Two of Wands",
  "Five of Pentacles|Judgement",
  "Judgement|Five of Pentacles",
  "Knight of Cups|Four of Wands",
  "Four of Wands|Knight of Cups",
  "Four of Pentacles|Knight of Wands",
  "Knight of Wands|Four of Pentacles",
  "Eight of Pentacles|Queen of Pentacles",
  "Queen of Pentacles|Eight of Pentacles",
  "Seven of Cups|The Fool",
  "The Fool|Seven of Cups",
  "The Moon|Eight of Wands",
  "Eight of Wands|The Moon",
  "Ace of Cups|Ten of Pentacles",
  "Ten of Pentacles|Ace of Cups",
  "Seven of Pentacles|Ten of Pentacles",
  "Ten of Pentacles|Seven of Pentacles",
  "Knight of Cups|Ten of Wands",
  "Ten of Wands|Knight of Cups",
  "The Magician|Judgement",
  "Judgement|The Magician",
  "The Devil|Knight of Wands",
  "Knight of Wands|The Devil",
  "The Lovers|Four of Pentacles",
  "Four of Pentacles|The Lovers",
]);

function pairKey(c1, c2) {
  return `${c1.name}|${c2.name}`;
}
function pairAllowed(c1, c2) {
  const k = pairKey(c1, c2);
  const r = pairKey(c2, c1);
  return !EXCLUDED_PAIR_KEYS.has(k) && !EXCLUDED_PAIR_KEYS.has(r);
}

function clean(v) {
  return String(v || "").trim();
}
function sentenceCase(str) {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
function ensureTerminalPunctuation(str) {
  if (!str) return "";
  const trimmed = str.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
function cleanSentence(str) {
  return ensureTerminalPunctuation(sentenceCase(str));
}
function joinCleanSentences(parts) {
  return parts
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .map((part) => cleanSentence(part))
    .join(" ");
}
function firstSentenceOnly(text) {
  const t = clean(text);
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/);
  return parts[0] ? parts[0].trim() : t;
}
function lowerInitial(str) {
  if (!str) return "";
  const trimmed = String(str).trim();
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}
function isGeneric(str) {
  const s = String(str || "");
  return (
    /pause before deciding|not yet decisive|supports, redirects, or resists/i.test(s) ||
    /the interaction depends on how the second energy meets the first/i.test(s) ||
    /the combined line resolves as support/i.test(s)
  );
}
function isGenericInteractionLine(line) {
  const t = clean(line);
  if (!t) return true;
  return (
    t.startsWith("The interaction depends on how the second energy meets the first") ||
    t.includes("whether it supports, redirects, or resists what is already in motion")
  );
}
function interactionSignal(interactionLine) {
  if (!interactionLine || isGenericInteractionLine(interactionLine) || isGeneric(interactionLine)) {
    return "Shift";
  }
  const line = String(interactionLine || "").toLowerCase();
  if (line.includes("forward movement") || line.includes("rather than resistance")) return "Sequence";
  if (line.includes("exhaustion") || line.includes("collapse") || line.includes("finality")) return "Collapse";
  if (line.includes("confirms") || line.includes("completes") || line.includes("support")) return "Support";
  if (line.includes("natural sequence") || line.includes("builds on")) return "Sequence";
  if (line.includes("strain") || line.includes("forced movement")) return "Strain";
  if (line.includes("reset")) return "Reset";
  if (line.includes("breaks") || line.includes("overrides")) return "Rupture";
  if (line.includes("reduces") || line.includes("drains")) return "Dissolution";
  if (line.includes("tension")) return "Tension";
  return "Shift";
}
function face(card, isReversed) {
  return isReversed ? card.reversed : card.upright;
}
function effectPrefix(effect) {
  return String(effect || "")
    .trim()
    .toLowerCase()
    .split("\u2014")[0]
    .trim()
    .split(/\s+/)[0];
}
function classifyInteractionFallbackLine(p1, p2, c1, c2) {
  const n1 = c1?.name || "the first card";
  const n2 = c2?.name || "the second card";
  const pressureish = ["pressures", "strains", "dominates", "crushes", "burdens"];
  if (pressureish.includes(p2)) {
    return `${n2} puts pressure on what ${n1} had already established.`;
  }
  return `${n2} changes what ${n1} had already set in motion.`;
}
function classifyInteraction(p1, p2, c1, c2) {
  const reinforcing = [
    "drives", "propels", "accelerates", "expands", "intensifies", "dominates", "pressures", "elevates", "ignites", "summons",
  ];
  const reducing = ["reduces", "deflates", "loosens", "dissolves", "releases", "softens", "yields", "drains", "depletes", "removes"];
  const disruptive = ["shatters", "fractures", "disrupts", "destabilises", "undermines", "unsettles"];
  const dispersing = ["disperses", "scatters", "fragments"];
  const structuring = ["structures", "formalises", "governs", "anchors", "stabilises", "binds", "constrains"];
  const opening = ["opens", "introduces", "activates", "ignites"];
  const focusing = ["focuses", "narrows", "cuts", "pierces", "concentrates"];
  if (dispersing.includes(p1) && reducing.includes(p2)) {
    return "The first card scatters the situation, while the second reduces what remains, thinning the room out.";
  }
  if (opening.includes(p1) && focusing.includes(p2)) {
    return "The second card builds on what the first has opened, creating a natural sequence.";
  }
  if (structuring.includes(p1) && disruptive.includes(p2)) {
    return "Established structure meets forceful collapse, producing unavoidable change.";
  }
  if (reinforcing.includes(p1) && reinforcing.includes(p2)) {
    return "Both cards are pushing in the same direction, amplifying the effect.";
  }
  if (reducing.includes(p2)) {
    return `${c2.name} reduces or drains what ${c1.name} has created.`;
  }
  if (dispersing.includes(p2)) {
    return `${c2.name} disrupts the pattern ${c1.name} created.`;
  }
  if (disruptive.includes(p2)) {
    return `${c2.name} breaks or overrides the structure ${c1.name} created.`;
  }
  if (p1 === "governs" && p2 === "opens") {
    return "Structured control meets open potential, creating a reset against imposed order.";
  }
  if ((opening.includes(p2) && structuring.includes(p1)) || (focusing.includes(p1) && dispersing.includes(p2))) {
    return "The two cards are working at cross purposes, creating instability in how the situation develops.";
  }
  if (
    (p1 === "withholds" && p2 === "accelerates") ||
    (p1 === "obscures" && p2 === "accelerates") ||
    (p1 === "blocks" && p2 === "accelerates")
  ) {
    return "One card holds the situation back while the other pushes it forward, creating strain through forced movement without alignment.";
  }
  if (
    (p1 === "pairs" && p2 === "completes") ||
    (p1 === "aligns" && p2 === "completes") ||
    (p1 === "nourishes" && p2 === "sustains") ||
    (p1 === "opens" && p2 === "nourishes") ||
    (p1 === "stabilises" && p2 === "sustains")
  ) {
    return "The second card confirms and completes what the first has opened, creating support rather than resistance.";
  }
  if (
    (p1 === "depletes" && p2 === "drives") ||
    (p1 === "drains" && p2 === "drives") ||
    (p1 === "cuts" && p2 === "depletes") ||
    (p1 === "pressures" && p2 === "shatters")
  ) {
    return "The second card escalates what is already damaged, pushing the situation toward exhaustion or collapse.";
  }
  if (
    (p1 === "opens" && p2 === "propels") ||
    (p1 === "opens" && p2 === "drives") ||
    (p1 === "opens" && p2 === "focuses") ||
    (p1 === "introduces" && p2 === "drives") ||
    (p1 === "opens" && p2 === "anchors")
  ) {
    return "The second card gives direction to what the first has opened, creating forward movement rather than resistance.";
  }
  if ((p1 === "pairs" && p2 === "sustains") || (p1 === "aligns" && p2 === "drives")) {
    return "The two cards align and build on each other, creating momentum that carries the situation forward.";
  }
  return classifyInteractionFallbackLine(p1, p2, c1, c2);
}
const signalWordMap = {
  accelerates: "Acceleration",
  aligns: "Alignment",
  binds: "Constraint",
  blocks: "Block",
  completes: "Completion",
  constrains: "Restriction",
  cuts: "Severance",
  deepens: "Depth",
  depletes: "Depletion",
  drains: "Depletion",
  drives: "Drive",
  focuses: "Direction",
  introduces: "Introduction",
  nourishes: "Nurture",
  obscures: "Obscuring",
  opens: "Opening",
  pairs: "Connection",
  propels: "Momentum",
  shatters: "Collapse",
  slows: "Stillness",
  stabilises: "Stability",
  structures: "Structure",
  sustains: "Sustain",
  withholds: "Withholding",
};
function normaliseSignalTerm(term) {
  const value = String(term || "").toLowerCase();
  const map = {
    fulfilling: "completion",
    accelerating: "acceleration",
    driving: "momentum",
    defeating: "conflict",
    ending: "ending",
    bonding: "connection",
  };
  return map[value] || value;
}
function vocabularyWord(card, isReversed) {
  const vocab = card.relationalVocabulary;
  if (!vocab) return null;
  const list = isReversed ? vocab.reversed : vocab.upright;
  if (!Array.isArray(list) || list.length === 0) return null;
  const preferred = [
    "threshold", "momentum", "connection", "completion", "depletion", "collapse", "rupture", "concealment",
    "acceleration", "rigidity", "support", "stability", "direction", "opening", "bonding", "ending", "conflict",
    "alignment", "pressure", "release", "clarity", "withdrawal", "reflection",
  ];
  const match = preferred.find((term) => list.some((item) => String(item).toLowerCase() === term));
  if (match) return normaliseSignalTerm(match);
  return normaliseSignalTerm(list[0]);
}
function signalWord(prefix, card, isReversed) {
  const vocab = vocabularyWord(card, isReversed);
  if (vocab) {
    return vocab.charAt(0).toUpperCase() + vocab.slice(1);
  }
  if (signalWordMap[prefix]) {
    return signalWordMap[prefix];
  }
  return "Shift";
}
function splitSignalRoles(signalLine) {
  const parts = String(signalLine || "")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  return { first: parts[0] || "", second: parts[1] || "", interaction: parts[2] || "" };
}
function buildMoveText(c1, c2, signalLine) {
  const roles = splitSignalRoles(signalLine);
  const first = roles.first ? roles.first.toLowerCase() : "";
  const second = roles.second ? roles.second.toLowerCase() : "";
  if (first && second) {
    return cleanSentence(`Watch the point where ${first} meets ${second}, and name what has to change next.`);
  }
  return cleanSentence(`Watch what changes after ${c2.name} enters the room ${c1.name} has created.`);
}
function scrubShiftParagraphCopy(str) {
  let t = String(str || "");
  t = t.replace(/\benters the room\b/gi, "arrives");
  t = t.replace(/\bthe room\b/gi, "here");
  t = t.replace(/\bpreceding charge\b/gi, "what came before");
  t = t.replace(/\badjacent cards?\b/gi, "");
  t = t.replace(/\bthe field\b/gi, "the situation");
  t = t.replace(/\b(a|the) fields\b/gi, "$1 situations");
  t = t.replace(/\b(a|the) field\b/gi, "$1 situation");
  t = t.replace(/\bfields\b/gi, "situations");
  t = t.replace(/\bfield\b/gi, "situation");
  t = t.replace(/\bspreads\b/gi, "wider patterns");
  t = t.replace(/\bspread\b/gi, "wider pattern");
  t = t.replace(/\bprior card\b/gi, "what came before");
  t = t.replace(/\bthe what came before\b/gi, "what came before");
  t = t.replace(/\bestablished situation\b/gi, "established pattern");
  t = t.replace(/\bthe existing situation\b/gi, "what is already happening");
  t = t.replace(/\bcards\b/gi, "turns");
  t = t.replace(/\bcard\b/gi, "turn");
  t = t.replace(/\bpositions\b/gi, "places");
  t = t.replace(/\bposition\b/gi, "place");
  t = t.replace(/\bcharges\b/gi, "what had built up");
  t = t.replace(/\bcharge\b/gi, "what had built up");
  t = t.replace(/\bwithin a situation of\b/gi, "within");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}
function repairShiftParagraphAfterScrub(str) {
  let t = String(str || "");
  t = t.replace(/\bthe situation breaks what is already happening\b/gi, "the situation interrupts what is already happening");
  t = t.replace(/\bit breaks what is already happening\b/gi, "it interrupts what is already happening");
  t = t.replace(/\bthe situation divides what is already happening\b/gi, "the situation splits what is already happening");
  t = t.replace(/\bit divides what is already happening\b/gi, "it splits what is already happening");
  t = t.replace(/\bbreaks what is already happening\b/gi, "interrupts what is already happening");
  t = t.replace(/\bdivides what is already happening\b/gi, "splits what is already happening");
  t = t.replace(/\bmaterial situation\b/gi, "material ground");
  t = t.replace(/\bthe situation sets a (.+?)\s+situation\s+that\b/gi, "the situation establishes a $1 base that");
  t = t.replace(/\bthe situation is material ground at origin\b/gi, "the situation centres on material possibility at an early stage");
  t = t.replace(/\bthe situation is a contained emotional situation\b/gi, "the situation holds emotional life in a tight frame");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function truncateShiftContextClause(s, maxLen) {
  const t = clean(String(s || ""));
  if (!t) return "";
  const cap = typeof maxLen === "number" && maxLen > 40 ? maxLen : 120;
  let out =
    t.length <= cap
      ? t
      : (() => {
          const slice = t.slice(0, cap);
          const cut = slice.lastIndexOf(" ");
          return (cut > 40 ? slice.slice(0, cut) : slice).trim();
        })();
  while (/\b(toward|into|from|with)\s*$/i.test(out) && out.length > 55) {
    const cut = out.lastIndexOf(" ", out.length - 1);
    if (cut < 35) break;
    out = out.slice(0, cut).trim();
  }
  return out;
}
function normalizeWhenLineForShiftContext(raw) {
  let t = clean(String(raw || ""));
  if (!t) return "";
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/^(upright|reversed),?\s+/i, "");
  let u = firstSentenceOnly(t) || t;
  u = u.replace(/^(upright|reversed),?\s+/i, "").trim();
  u = u.replace(/\bprior material\b/gi, "what came before");
  u = u.replace(/\bprior momentum\b/gi, "what came before");
  u = u.replace(/\bexisting material\b/gi, "what is already there");
  u = u.replace(/\bexisting energy\b/gi, "what is already present");
  u = u.replace(/\bexisting situation\b/gi, "what is already happening");
  u = u.replace(/\binto a finished state\b/gi, "to completion");
  u = u.replace(/\bmaterial situation\b/gi, "condition");
  u = u.replace(/\bgoverned situation\b/gi, "governed emotional state");
  u = u.replace(/\btransitional situation\b/gi, "transitional state");
  u = u.replace(/\bexisting situation\b/gi, "what is already happening");
  u = u.replace(/\bthe what is already there\b/gi, "what is already there");
  u = u.replace(/\bthe field\b/gi, "what is already in play");
  u = u.replace(/\b(a|the) fields\b/gi, "$1 situations in play");
  u = u.replace(/\bprojection-saturated\b/gi, "full of projections");
  u = u.replace(/\bcollaborative material\b/gi, "collaborative structure");
  u = u.replace(/\bloss-weighted\b/gi, "shaped by loss");
  u = u.replace(/\bprior turn\b/gi, "what came before");
  u = u.replace(/\breceives\b/gi, "takes in");
  u = u.replace(/\breceiving\b/gi, "taking in");

  u = u.replace(/^defines the interaction as one\s+/i, "");
  u = u.replace(/^defines the interaction as\s+/i, "");
  u = u.replace(/^establishes\s+/i, "the situation is ");
  u = u.replace(/^introduces\s+/i, "the situation introduces ");
  u = u.replace(/^negotiates by\s+/i, "responding by ");
  u = u.replace(/^it\s+/i, "the situation ");
  u = u.replace(/^(draws|pulls|takes|adds|breaks|speeds|removes|reduces|applies|encloses|extends|slows|splits|reframes|stabilises|drives|subjects|divides|narrows|converts)\b/i, "the situation $1");
  u = u.replace(/^adds\s+/i, "adds ");
  u = u.replace(/^strips\s+/i, "pulls back from ");
  u = u.replace(/^completes or delays\s+/i, "");
  u = u.replace(/^collapses or fractures\s+/i, "breaks open ");
  u = u.replace(/^accelerates and resolves\s+/i, "speeds toward resolution while ");
  u = u.replace(/^accelerates and\s+/i, "speeds up while ");
  u = u.replace(/\bestablishes\b/gi, "sets");
  u = u.replace(/\bestablishing\b/gi, "setting");
  u = u.replace(/\bintegrates\b/gi, "weaves together");
  u = u.replace(/\bintegrating\b/gi, "weaving together");
  u = u.replace(/\babsorbs\b/gi, "takes up");
  u = u.replace(/\bstrips\b/gi, "pulls back from");
  u = u.replace(/\bnegotiates by\b/gi, "responds by");
  u = u.replace(/\bdepletes\b/gi, "empties out");
  u = u.replace(/\bseals\b/gi, "closes around");
  u = u.replace(/\bstills\b/gi, "quiets");
  u = u.replace(/\bobscures\b/gi, "muddies");
  u = u.replace(/\bdeepens\b/gi, "goes deeper into");
  u = u.replace(/\bwithholds\b/gi, "holds back");
  u = u.replace(/\bburdens\b/gi, "weighs on");
  u = u.replace(/\bredirects\b/gi, "turns");
  u = u.replace(/\brestricts\b/gi, "tightens");
  u = u.replace(/\bdisrupts\b/gi, "unsettles");
  u = u.replace(/\breleases\b/gi, "lets go of");
  u = u.replace(/\bopens\b/gi, "opens up");
  u = u.replace(/the situation\s+(?=(takes|adds|pulls|breaks|speeds|removes))/gi, "it ");
  u = u.replace(/\s+/g, " ").trim();
  u = u.replace(/\s+and\s+carries\s+/i, ", carrying ");
  u = u.replace(/\s+/g, " ").trim();
  u = u.replace(/\btakes up it\b/gi, "takes it up");
  u = u.replace(/\b([A-Z])([a-z]+)\b/g, (m, a, b) => a.toLowerCase() + b);
  u = u.replace(/\bthe situation is a ([a-z]+) situation\b/gi, "the situation is $1");
  u = u.replace(/\bthe situation is an ([a-z]+) situation\b/gi, "the situation is $1");
  u = u.replace(/\bthe situation is a ([a-z]+(?:\s+[a-z]+){0,2})\s+situation\b/gi, "the situation is $1");
  u = u.replace(/\bthe situation is a field grounded in\b/gi, "the situation is grounded in");
  u = u.replace(/\bthe situation is a field of\b/gi, "the situation centres on");
  u = u.replace(/\bthe situation is a field\b/gi, "the situation is");
  u = u.replace(/\bthe situation is a situation\b/gi, "the situation is");
  u = u.replace(/\bthe situation is ([a-z]+)\s+([a-z]+)\s+field\b/gi, (_m, w1, w2) =>
    w1 === "suspended" && w2 === "material"
      ? "the situation holds material development in suspension"
      : `the situation is ${w1} ${w2}`,
  );
  u = u.replace(/\bthe situation is an? ([a-z-]+)\s+field\b/gi, "the situation is $1");
  u = u.replace(/\bwithin a situation of\b/gi, "within");
  u = u.replace(/\binto the existing situation\b/gi, "into what is already happening");
  u = u.replace(/\bestablished situation\b/gi, "established pattern");
  u = u.replace(/\bthe situation is a full of projections (field|situation)\b/gi, "the situation is full of projections");
  u = u.replace(/\bthe what came before\b/gi, "what came before");
  u = truncateShiftContextClause(u, 180);
  return u;
}
function polishShiftSentence(str) {
  let t = String(str || "");

  t = t.replace(/\backnowledges that binding and begins the structural release recognition allows\b/gi,
    "acknowledges that binding exists and begins the structural release that recognition allows");

  t = t.replace(/\breduces material availability of what came before\b/gi,
    "reduces access to what was previously available");
  t = t.replace(/\bthe situation reduces material availability of what came before\b/gi,
    "the situation reduces access to what was previously available");
  t = t.replace(/\breduces material availability of preceding charge\b/gi,
    "reduces access to what was previously available");
  t = t.replace(/\bthe situation reduces material availability of preceding charge\b/gi,
    "the situation reduces access to what was previously available");

  t = t.replace(/\bnot yet binding\b/gi,
    "not yet fixed");

  return t;
}
function repairShiftSentence(str) {
  let t = String(str || "");

  t = t.replace(/\bsets a situation of\b/gi, "establishes");
  t = t.replace(/\bthe situation sets a situation of\b/gi, "the situation establishes");
  t = t.replace(/\bthe situation sets a field of\b/gi, "the situation establishes");
  t = t.replace(/\bsets a field of\b/gi, "establishes");

  t = t.replace(
    /\bthe situation is an?\s+(collective|observational|suspended|saturated)\b(?!\s+(dynamic|stance|state|condition)\b)/gi,
    (m, a) => {
      const map = {
        collective: "collective dynamic",
        observational: "observational stance",
        suspended: "suspended state",
        saturated: "saturated condition"
      };
      return "the situation is a " + map[a];
    },
  );

  t = t.replace(/\bis a observational\b/gi, "is an observational");

  t = t.replace(/\binto lasting\.\b/gi, "into lasting form.");
  t = t.replace(/\binto lasting\b/gi, "into something lasting");

  t = t.replace(/\bbreaks what is already happening\b/gi,
    "interrupts what is already happening");
  t = t.replace(/\bdivides what is already happening\b/gi,
    "splits what is already happening");

  return t;
}
function buildShiftFallbackContextSentence(whenFirstText, whenSecondText) {
  const a = normalizeWhenLineForShiftContext(whenFirstText);
  const b = normalizeWhenLineForShiftContext(whenSecondText);
  if (!a && !b) return "";
  const fragA = a ? lowerInitial(a.replace(/[.!?]+$/, "")) : "";
  const fragB = b ? lowerInitial(b.replace(/[.!?]+$/, "")) : "";
  if (fragA && fragB) {
    return cleanSentence(repairShiftSentence(polishShiftSentence(`This means ${fragA}, while ${fragB}.`)));
  }
  if (fragA) {
    return cleanSentence(`This means ${fragA}.`);
  }
  return cleanSentence(`This means ${fragB}.`);
}
function countShiftAnchorSentences(anchorText) {
  const t = clean(String(anchorText || ""));
  if (!t) return 0;
  const chunks = t.split(/(?<=[.!?])\s+/).map((x) => clean(x)).filter(Boolean);
  return chunks.length > 0 ? chunks.length : 1;
}
function buildShiftParagraph(c1, c2, whenFirstText, whenSecondText, moveText) {
  const anchorRaw = clean(moveText);
  if (!anchorRaw) return "";
  const anchorSentenceCount = countShiftAnchorSentences(anchorRaw);
  const r1 = clean(whenFirstText).toLowerCase();
  const r2 = clean(whenSecondText).toLowerCase();
  const exchangeTone =
    /\b(?:exchange|exchanges|exchanging|redistribut(?:e|es|ed|ing|ion|ive)|redistribution|receive|receives|receiving|received|giving|giver|givers|surplus|deficit|equity|equitable|circulat(?:e|es|ed|ing|ion)|dispens(?:e|es|ed|ing|ation)|allocat(?:e|es|ed|ing|ion)|imbalance|imbalanced|imbalances|uneven|unevenly)\b|material flow|restore flow|give-and-take/i.test(
      r1,
    );
  const collabTone =
    /\b(?:collaboration|collaborative|collaborate|collaborators|collaboratively|contributing|contribution|contributors?|contributes|contributed|co[- ]?creat(?:e|es|ed|ing|ion)|teamwork)\b|shared structure|collective (?:effort|output|work|form|project)/i.test(
      r2,
    );
  const parts = [cleanSentence(anchorRaw)];
  if (exchangeTone && collabTone) {
    parts.push(
      cleanSentence(
        "The shift moves from exchange that has been uneven or conditional into something that requires clearer collaboration and shared structure.",
      ),
    );
  } else if (exchangeTone) {
    parts.push(
      cleanSentence(
        "What is already moving leans on uneven exchange and lopsided give-and-take before the next push.",
      ),
    );
  } else if (collabTone) {
    parts.push(
      cleanSentence(
        "What presses now asks for clearer agreement about how effort lines up and how stakes are shared.",
      ),
    );
  }
  if (parts.length === 1 && anchorSentenceCount === 1) {
    const ctx = buildShiftFallbackContextSentence(whenFirstText, whenSecondText);
    if (clean(ctx)) {
      parts.push(ctx);
    }
  }
  const joined = joinCleanSentences(parts.slice(0, 3));
  return repairShiftParagraphAfterScrub(
    scrubShiftParagraphCopy(polishShiftSentence(repairShiftSentence(joined))),
  );
}
function extractOrientationText(text, orientation) {
  if (!text) return "";
  const uprightMatch = text.match(/Upright,([^]+?)(?=Reversed,|$)/);
  const reversedMatch = text.match(/Reversed,([^]+)$/);
  if (orientation === "upright" && uprightMatch) {
    return uprightMatch[1].trim();
  }
  if (orientation === "reversed" && reversedMatch) {
    return reversedMatch[1].trim();
  }
  return text;
}
function computeShiftParagraph(c1, c2, rev1, rev2) {
  const f1 = face(c1, rev1);
  const f2 = face(c2, rev2);
  const p1 = effectPrefix(f1.relationalEffect);
  const p2 = effectPrefix(f2.relationalEffect);
  const classifyLine = classifyInteraction(p1, p2, c1, c2);
  const s1 = signalWord(p1, c1, rev1);
  const s2 = signalWord(p2, c2, rev2);
  const s3 = interactionSignal(classifyLine);
  const signal = `${s1} + ${s2} + ${s3}`;
  const o1 = rev1 ? "reversed" : "upright";
  const o2 = rev2 ? "reversed" : "upright";
  const whenFirst1 = c1.combinationLogic && String(c1.combinationLogic.whenFirst || "").trim();
  const whenSecond2 = c2.combinationLogic && String(c2.combinationLogic.whenSecond || "").trim();
  const whenFirstText = extractOrientationText(whenFirst1, o1);
  const whenSecondText = extractOrientationText(whenSecond2, o2);
  let moveText = null;
  if (
    (p1 === "depletes" && p2 === "drives") ||
    (p1 === "drains" && p2 === "drives") ||
    (p1 === "cuts" && p2 === "depletes") ||
    (p1 === "pressures" && p2 === "shatters")
  ) {
    moveText =
      "Stop trying to recover this through more force. The second card is not repairing the first condition; it is carrying it toward exhaustion, collapse, or finality.";
  }
  if (
    !moveText &&
    ((p1 === "constrains" && p2 === "shatters") ||
      (p1 === "structures" && p2 === "shatters") ||
      (p1 === "binds" && p2 === "shatters"))
  ) {
    moveText =
      "Stop trying to hold the structure together by force. The second card is exposing what can no longer be contained, controlled, or repaired by maintaining the old frame.";
  }
  if (
    !moveText &&
    ((p1 === "opens" && p2 === "focuses") ||
      (p1 === "introduces" && p2 === "drives") ||
      (p1 === "pairs" && p2 === "completes") ||
      (p1 === "aligns" && p2 === "completes"))
  ) {
    moveText =
      "Let the sequence complete before questioning it. The second card is not fighting the first; it is giving direction, shape, or completion to what has already begun.";
  }
  if (
    !moveText &&
    ((p1 === "nourishes" && p2 === "sustains") ||
      (p1 === "opens" && p2 === "nourishes") ||
      (p1 === "stabilises" && p2 === "sustains"))
  ) {
    moveText =
      "Let the connection develop instead of forcing a new question onto it. The second card appears to confirm, complete, or stabilise what the first has already opened.";
  }
  if (!moveText && p1 === "withholds" && p2 === "accelerates") {
    moveText =
      "Do not mistake speed for resolution. Something important is still withheld, and movement without alignment may increase strain rather than solve it.";
  }
  if (
    moveText === null &&
    ((p1 === "deepens" && p2 === "reduces") ||
      (p1 === "deepens" && p2 === "draws") ||
      (p1 === "withholds" && p2 === "draws") ||
      (p1 === "stills" && p2 === "draws") ||
      (p1 === "deepens" && p2 === "stills") ||
      (p1 === "deepens" && p2 === "slows") ||
      (p1 === "withholds" && p2 === "slows"))
  ) {
    moveText =
      "Do not rush this into action. Stay with what is being revealed, reduce the noise, and let the deeper signal become clear before deciding what comes next.";
  }
  if (
    moveText === null &&
    ["deepens", "stills", "withholds", "draws", "reduces", "slows"].includes(p1) &&
    ["deepens", "stills", "withholds", "draws", "reduces", "slows"].includes(p2)
  ) {
    moveText =
      "This is not asking for immediate action. Listen longer, reduce pressure, and let the real meaning surface before making a decision.";
  }
  if (!moveText) {
    moveText = buildMoveText(c1, c2, signal);
  }
  if (c2.id === "the-tower" || c2.name === "The Tower") {
    moveText =
      "Do not try to stabilise this. The second influence is breaking something open that cannot be held together any longer. Let what is collapsing fall, rather than trying to preserve it.";
  }
  return buildShiftParagraph(c1, c2, whenFirstText, whenSecondText, moveText);
}

const minors = tarotCardsNew.filter((c) => c.arcana === "Minor");
const all = tarotCardsNew;

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function paragraphPasses(para) {
  const t = String(para || "");
  if (!t) return false;
  if (/\bWhat is already moving leans on uneven exchange\b/.test(t)) return false;
  if (/\bWhat presses now asks for clearer agreement\b/.test(t)) return false;
  if (/\bThe shift moves from exchange that has been uneven\b/.test(t)) return false;
  if (/\bfield\b|\bprior material\b|\bfinished state\b|\bthe what\b|\bprior turn\b/i.test(t)) return false;
  if (/governed situation|transitional situation|loss-weighted situation|suspended situation|completed shared situation|situation of discernment|\bis a [a-z-]+ situation\b/i.test(t)) return false;
  if (/\bthe situation is a [a-z]+,\s/i.test(t)) return false;
  if (/\bexisting situation\b/i.test(t)) return false;
  if (/\bis a [a-z]+ [a-z]+ situation\b/i.test(t)) return false;
  if (/\bis an? [a-z]+,\s/i.test(t)) return false;
  if (/\bsets a [^,]+ situation that\b/i.test(t)) return false;
  if (/\btoward\.\s*$/i.test(t.trim())) return false;
  if (/so that continuation/i.test(t)) return false;
  if (/while\s+(takes|draws|expands|divides|converts|narrows|turns|subjects|cuts|grounds|drives|saturates|advances|encloses|stabilises)\b/i.test(t)) return false;
  if (/rather than\.?$|rather than proof$/i.test(t.trim())) return false;
  if (/This means collaborative\b/i.test(t)) return false;
  if (/the situation sets a situation/i.test(t)) return false;
  if (/material situation/i.test(t)) return false;
  if ((t.match(/\bthe situation\b/gi) || []).length >= 3) return false;
  if (/\bthe situation\b[^.]{0,220}\bthe situation\b/i.test(t)) return false;
  if (/converting the situation into/i.test(t)) return false;
  return true;
}

function tryBuildBatch() {
  const batch = [];
  const usedKeys = new Set();

  for (let attempt = 0; attempt < 400 && batch.length < 2; attempt++) {
    const c1 = minors[randInt(minors.length)];
    const c2 = minors[randInt(minors.length)];
    if (c1.name === c2.name) continue;
    const k = pairKey(c1, c2);
    if (usedKeys.has(k)) continue;
    if (!pairAllowed(c1, c2)) continue;
    usedKeys.add(k);
    batch.push({ c1, c2, rev1: Math.random() < 0.5, rev2: Math.random() < 0.5 });
  }
  if (batch.length < 2) return null;

  for (let attempt = 0; attempt < 25000 && batch.length < 5; attempt++) {
    const c1 = all[randInt(all.length)];
    const c2 = all[randInt(all.length)];
    if (c1.name === c2.name) continue;
    const k = pairKey(c1, c2);
    if (usedKeys.has(k)) continue;
    if (!pairAllowed(c1, c2)) continue;
    usedKeys.add(k);
    batch.push({ c1, c2, rev1: Math.random() < 0.5, rev2: Math.random() < 0.5 });
  }
  if (batch.length < 5) return null;

  let pairsWithRev = 0;
  for (const r of batch) {
    if (r.rev1 || r.rev2) pairsWithRev++;
  }
  while (pairsWithRev < 2) {
    const r = batch[randInt(batch.length)];
    if (!r.rev1 && !r.rev2) {
      r.rev2 = true;
      pairsWithRev++;
    } else break;
  }
  if (pairsWithRev < 2) return null;

  const minorOnly =
    batch[0].c1.arcana === "Minor" &&
    batch[0].c2.arcana === "Minor" &&
    batch[1].c1.arcana === "Minor" &&
    batch[1].c2.arcana === "Minor";
  if (!minorOnly) return null;

  if (!batch.every(({ c1, c2, rev1, rev2 }) => paragraphPasses(computeShiftParagraph(c1, c2, rev1, rev2)))) {
    return null;
  }

  return batch;
}

if (process.env.TOK2_SHIFT_FIXED20 === "1") {
  const byName = new Map(tarotCardsNew.map((c) => [c.name, c]));
  const FIXED_PAIRS = [
    ["The Magician", false, "Ten of Swords", true],
    ["Two of Cups", true, "Knight of Pentacles", false],
    ["Eight of Wands", false, "Queen of Swords", true],
    ["Three of Cups", false, "Five of Pentacles", true],
    ["Page of Swords", true, "King of Wands", false],
    ["The Sun", true, "Nine of Cups", false],
    ["Four of Swords", false, "Seven of Wands", true],
    ["Ace of Pentacles", false, "Three of Swords", true],
    ["Knight of Cups", true, "Ten of Pentacles", false],
    ["Six of Wands", false, "Eight of Cups", true],
    ["Queen of Cups", false, "Two of Swords", true],
    ["Five of Wands", true, "King of Swords", false],
    ["Nine of Swords", false, "Ace of Cups", true],
    ["Four of Wands", false, "Knight of Swords", true],
    ["Seven of Pentacles", false, "The Moon", true],
    ["The Star", false, "Ten of Wands", true],
    ["Six of Cups", true, "Page of Pentacles", false],
    ["The Hermit", false, "Three of Wands", true],
    ["Justice", true, "Eight of Pentacles", false],
    ["Death", true, "Queen of Pentacles", false],
  ];

  for (let i = 0; i < FIXED_PAIRS.length; i++) {
    const [n1, rev1, n2, rev2] = FIXED_PAIRS[i];
    const c1 = byName.get(n1);
    const c2 = byName.get(n2);
    if (!c1 || !c2) {
      console.error(`Missing card: ${n1} or ${n2}`);
      process.exit(1);
    }
    const o1 = rev1 ? "Reversed" : "Upright";
    const o2 = rev2 ? "Reversed" : "Upright";
    const para = computeShiftParagraph(c1, c2, rev1, rev2);
    console.log(`PAIR_${i + 1}\t${c1.name} (${o1}) + ${c2.name} (${o2})\t${para.replace(/\t/g, " ")}`);
  }
} else {
  let batch = null;
  for (let t = 0; t < 120000; t++) {
    batch = tryBuildBatch();
    if (batch) break;
  }
  if (!batch) {
    for (let t = 0; t < 30000; t++) {
      const b = tryBuildBatch();
      if (b) {
        batch = b;
        break;
      }
    }
  }
  if (!batch) {
    console.error("sample failed");
    process.exit(1);
  }

  for (let i = 0; i < 5; i++) {
    const { c1, c2, rev1, rev2 } = batch[i];
    const o1 = rev1 ? "Reversed" : "Upright";
    const o2 = rev2 ? "Reversed" : "Upright";
    const para = computeShiftParagraph(c1, c2, rev1, rev2);
    console.log(`PAIR_${i + 1}\t${c1.name} (${o1}) + ${c2.name} (${o2})\t${para.replace(/\t/g, " ")}`);
  }
}
