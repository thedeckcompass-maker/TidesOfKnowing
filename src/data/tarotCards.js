/**
 * Tides of Knowing — Rider–Waite–Smith deck meanings for on-site tools.
 * Original interpretive copy (not encyclopaedic). Slugs match /public/images/tarot/rws/*.jpg
 */

const MAJORS = [
  {
    name: "The Fool",
    slug: "the-fool",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["beginning", "risk", "openness", "trust", "innocence", "threshold", "curiosity"],
    coreMeaning:
      "A threshold appears before the plan is perfect: you are invited to move with honest uncertainty rather than false certainty.",
    lightExpression:
      "Curiosity outweighs pride; you let the path teach you without demanding a guarantee.",
    shadowExpression:
      "Impulse without preparation, or pretending not to notice consequences you already sense.",
    readingFunction:
      "Initiates the story: names what is naive, experimental, or deliberately unscripted in the question.",
    compassPrompt:
      "What becomes possible if you admit you do not yet know the full shape of this?",
    extendedKeywords: [
      "edge without a map",
      "honest naïveté",
      "experiment in daylight",
      "willingness to look clumsy",
      "leap before rehearsal",
      "skin in the game early",
      "path wider than opinion",
      "unscripted exposure",
      "first step with witnesses",
    ],
    essenceSentence:
      "The edge is real while the instructions are still thin; how you move here trains whether novelty becomes wisdom or only appetite.",
  },
  {
    name: "The Magician",
    slug: "the-magician",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["focus", "skill", "resources", "signal", "initiative", "craft", "articulation"],
    coreMeaning:
      "Attention gathers tools; what you aim at tends to answer back with opportunity and responsibility together.",
    lightExpression:
      "Clear intent, honest craft, and the quiet confidence of someone who has practised the basics.",
    shadowExpression:
      "Performance, manipulation, or scattering energy across too many half-kept promises.",
    readingFunction:
      "Steers agency: shows where technique, language, or positioning shapes outcomes.",
    compassPrompt:
      "Where are you naming what you truly want this work to accomplish?",
    extendedKeywords: [
      "focused intention",
      "directed will",
      "assembly of means",
      "hands on the instruments",
      "channeling raw supply",
      "stance that invites reply",
      "creating from nothing",
      "strategic use of tools",
      "decisive beginning",
    ],
    essenceSentence:
      "You have what you need, but the outcome depends entirely on how deliberately you use it.",
  },
  {
    name: "The High Priestess",
    slug: "the-high-priestess",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["stillness", "intuition", "mystery", "patience", "depth", "withholding", "inner sense"],
    coreMeaning:
      "Some truths ripen in quiet; not everything useful arrives as a headline or a debate.",
    lightExpression:
      "You honour subtle signals and refuse to force a story before it is ready to speak.",
    shadowExpression:
      "Withdrawal used as control, or intuition frozen into suspicion without daylight testing.",
    readingFunction:
      "Reveals the undertow: what is felt, implied, or held beneath the spoken narrative.",
    compassPrompt:
      "What are you refusing to listen to because it would slow the comfortable story?",
    extendedKeywords: [
      "subvocal truth",
      "reading the room's underside",
      "knowledge held back",
      "slow ripening",
      "door half-latched",
      "undertow conversation",
      "listening under noise",
      "reserve with teeth",
      "night logic",
      "unforced silence",
    ],
    essenceSentence:
      "Meaning is arriving sideways, and forcing the lid open now would change what was trying to form.",
  },
  {
    name: "The Empress",
    slug: "the-empress",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["nurture", "growth", "senses", "care", "abundance", "fertility", "shelter"],
    coreMeaning:
      "Life wants tending: conditions improve when what is alive here is fed honestly, not performatively.",
    lightExpression:
      "Warmth, hospitality, and the steady work of helping something become itself without rushing it.",
    shadowExpression:
      "Over-giving, smothering, or using comfort to avoid a harder truth that would mature you.",
    readingFunction:
      "Grounds growth: describes what is ripening, protected, or in need of gentler conditions.",
    compassPrompt:
      "What would genuine care look like here, without rescue fantasy?",
    extendedKeywords: [
      "life pressing for room",
      "hospitality under pressure",
      "tending without performance",
      "ripening in plain sight",
      "warmth with borders",
      "body-led generosity",
      "conditions that reward honest feeding",
      "making room for what is alive",
      "earthly comfort with truth in it",
    ],
    essenceSentence:
      "What is alive here is asking to be fed, and the next choices decide whether care becomes shelter or smothering.",
  },
  {
    name: "The Emperor",
    slug: "the-emperor",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["structure", "boundary", "order", "responsibility", "protection", "authority", "container"],
    coreMeaning:
      "Order is not cruelty; it is how fragile things survive pressure, time, and other people’s appetites.",
    lightExpression:
      "Fair rules, clear leadership, and the relief of knowing what is allowed and what is not.",
    shadowExpression:
      "Rigidity, domination, or law used to silence discomfort rather than meet it with dignity.",
    readingFunction:
      "Frames systems: authority, agreements, or the need for a container the situation can lean on.",
    compassPrompt:
      "Which boundary would make this safer without shutting down honesty?",
    extendedKeywords: [
      "rules with a face",
      "command on display",
      "protective perimeter",
      "law as lived comfort",
      "framework under stress",
      "who holds the veto",
      "refusal of collapse",
      "steady chair at chaos",
      "policy meets skin",
    ],
    essenceSentence:
      "Order is being offered as protection, and the cost is whoever must live inside the lines you draw tonight.",
  },
  {
    name: "The Hierophant",
    slug: "the-hierophant",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["tradition", "teaching", "belonging", "ethics", "form", "lineage", "covenant"],
    coreMeaning:
      "Shared language and lineage give shape; you are inside a story older than your private opinion.",
    lightExpression:
      "Mentorship, ceremony, and the dignity of learning in public with humility and consent.",
    shadowExpression:
      "Dogma, gatekeeping, or loyalty to form over the human being inside the form.",
    readingFunction:
      "Names institutions, vows, training, or the moral frame the reading keeps appealing to.",
    compassPrompt:
      "What part of this teaching still serves you, and what part is habit alone?",
    extendedKeywords: [
      "institutional gravity",
      "vows with witnesses",
      "shared language binding skin",
      "student posture in public",
      "mentor in the doorway",
      "rulebook on the table",
      "inheritance you did not write",
      "ceremony with stakes",
      "belonging tested by lived ethics",
    ],
    essenceSentence:
      "You are inside a story older than your private opinion, and the next move decides whether form serves the person or the reverse.",
  },
  {
    name: "The Lovers",
    slug: "the-lovers",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["choice", "alignment", "intimacy", "values", "union", "integrity", "fork"],
    coreMeaning:
      "A fork appears where the heart cannot lie; integrity becomes practical, not decorative.",
    lightExpression:
      "Honest attraction, consent, and the courage to choose what matches your life more than your image.",
    shadowExpression:
      "Splitting, fantasy bonding, or using another person to avoid deciding for yourself.",
    readingFunction:
      "Clarifies pairing: values conflict, attraction with consequence, or two paths that cannot both be honoured.",
    compassPrompt:
      "If you chose from love rather than fear, what would you stop pretending?",
    extendedKeywords: [
      "fork with consequences",
      "principles on collision course",
      "attraction under oath",
      "two futures sharing one bed",
      "consent at the wire",
      "matching life to desire",
      "resolution that costs image",
      "pairing without easy merge",
      "heart-backed decision",
    ],
    essenceSentence:
      "A fork is visible where pretending stops working, and the body already knows which answer would cost you less sleep.",
  },
  {
    name: "The Chariot",
    slug: "the-chariot",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["momentum", "will", "direction", "discipline", "victory", "steering", "competition"],
    coreMeaning:
      "Progress asks you to steer opposing pulls instead of letting them steer you by default.",
    lightExpression:
      "Focused drive, self-command, and the willingness to keep the line under stress without cruelty.",
    shadowExpression:
      "Winning at cost, burnout, or charging past signals that asked for adjustment, not more speed.",
    readingFunction:
      "Accelerates plot: movement, rivalry, or the need to hold a course without splitting in two.",
    compassPrompt:
      "What are you willing to leave behind to keep this journey honest?",
    extendedKeywords: [
      "opposing reins in one hand",
      "route chosen under fire",
      "pride and goal in same lane",
      "velocity with spectators",
      "hold-the-line resolve",
      "winning without splitting",
      "campaign rhythm",
      "nerve as steering wheel",
      "road that narrows options",
    ],
    essenceSentence:
      "Speed and rivalry are offering leverage, and the steering you use next decides whether motion becomes arrival or wreckage.",
  },
  {
    name: "Strength",
    slug: "strength",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["courage", "patience", "compassion", "nerve", "soft power", "taming", "presence"],
    coreMeaning:
      "Real strength meets intensity without flinching and without crushing what is still alive in you.",
    lightExpression:
      "Gentle persistence; you stay present with fear until it shrinks to its true size and name.",
    shadowExpression:
      "Bravado, swallowed anger, or kindness used to avoid naming harm that needs naming.",
    readingFunction:
      "Modulates heat: where courage is emotional, paced, and relational rather than loud.",
    compassPrompt:
      "Where could you be firmer with love, and where softer with truth?",
    extendedKeywords: [
      "heat met without crush",
      "soft jaw at danger",
      "animal breath slowing together",
      "fierce gentleness",
      "holding pressure without theatre",
      "gut unclenched on purpose",
      "steadiness under glare",
      "lions sharing the room",
      "quiet insistence that lasts",
    ],
    essenceSentence:
      "Intensity is present, and the next move proves whether love is steady enough to tame it without pretending it away.",
  },
  {
    name: "The Hermit",
    slug: "the-hermit",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["solitude", "reflection", "guidance", "honesty", "slowing", "lantern", "discernment"],
    coreMeaning:
      "Distance clarifies; you step back to hear your own voice without applause, argument, or hurry.",
    lightExpression:
      "Wise restraint, humble study, and the relief of a smaller, truer horizon you can actually walk.",
    shadowExpression:
      "Isolation as superiority, or hiding from contact that would actually mature the question.",
    readingFunction:
      "Slows the spread: retreat, inner counsel, or the need to stop borrowing opinions wholesale.",
    compassPrompt:
      "What question only you can answer if you stop consulting the crowd?",
    extendedKeywords: [
      "small flame on narrow path",
      "signal stripped",
      "distance as medicine",
      "refusing borrowed verdicts",
      "small true horizon",
      "footsteps slower than news",
      "teacher in exile",
      "truth before audience",
      "night walk with permission",
    ],
    essenceSentence:
      "Withdrawal is doing its work, and what you hear in the quiet will either simplify the path or deepen the exile you chose.",
  },
  {
    name: "Wheel of Fortune",
    slug: "the-wheel-of-fortune",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["change", "timing", "cycles", "luck", "turning point", "season", "momentum"],
    coreMeaning:
      "Circumstances shift; what mattered yesterday may not own tomorrow's weather or your leverage.",
    lightExpression:
      "Humility about peaks, grace in troughs, and trust that seasons turn without you being the sun.",
    shadowExpression:
      "Fatalism, superstition, or refusing agency because the story feels written in advance.",
    readingFunction:
      "Signals external movement: timing, luck, or events outside tight personal control.",
    compassPrompt:
      "What is yours to steer inside a change you did not fully choose?",
    extendedKeywords: [
      "circumstance doing acrobatics",
      "seasonal humiliation and lift",
      "luck with fine print",
      "swerve you did not author",
      "pivot arriving uninvited",
      "reversal in the weather",
      "table tilts under plates",
      "what peaked shows a receipt",
      "return of unfinished plot",
    ],
    essenceSentence:
      "The outside world is turning its own crank, and your leverage now is what you refuse to outsource while the wheel spins.",
  },
  {
    name: "Justice",
    slug: "justice",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["balance", "accountability", "law", "clarity", "consequence", "fairness", "reckoning"],
    coreMeaning:
      "Reality tallies; fairness begins with seeing what actually happened, not what flatters the ego.",
    lightExpression:
      "Clear standards, repair, and the courage to name both harm and responsibility without theatre.",
    shadowExpression:
      "Cold verdicts, blame rituals, or truth used as a weapon to avoid compassion.",
    readingFunction:
      "Weighs outcomes: agreements, audits, or the moment effects align with prior choices.",
    compassPrompt:
      "What fact, if spoken cleanly, would simplify this more than another argument?",
    extendedKeywords: [
      "scale in hand with witnesses",
      "evidence read aloud",
      "repair priced in public",
      "even split that hurts",
      "verdict without theatre",
      "accounts due this week",
      "order as mirror",
      "evenness that costs someone pride",
      "clean ledger fantasy ending",
    ],
    essenceSentence:
      "Reality is tallying, and the next honest naming decides whether repair becomes possible or only another performance of blame.",
  },
  {
    name: "The Hanged Man",
    slug: "the-hanged-man",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["pause", "surrender", "perspective", "waiting", "release", "inversion", "yielding"],
    coreMeaning:
      "Progress sometimes looks like stopping: you suspend force until meaning turns and shows its other face.",
    lightExpression:
      "Voluntary pause, humility, and a willingness to see the old problem upside-down without drama.",
    shadowExpression:
      "Victim stance, martyrdom, or stalling disguised as spirituality or depth.",
    readingFunction:
      "Suspends certainty: sacrifice that teaches, or a view only found off the usual angle.",
    compassPrompt:
      "What becomes obvious if you stop trying to buy progress with effort alone?",
    extendedKeywords: [
      "view hung upside down",
      "active yielding",
      "delay with intelligence",
      "rope as classroom",
      "progress disguised as stop",
      "listening from the underside",
      "voluntary discomfort",
      "letting go bought with dignity",
      "time bending for sight",
    ],
    essenceSentence:
      "Force is offline on purpose, and the angle you accept next decides whether the pause becomes insight or only a prettier stall.",
  },
  {
    name: "Death",
    slug: "death",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["ending", "release", "transformation", "threshold", "renewal", "closure", "compost"],
    coreMeaning:
      "A shape of life completes; what follows needs room the old form cannot give, no matter how familiar.",
    lightExpression:
      "Honest grief, clean closure, and respect for what lived even as it leaves the stage.",
    shadowExpression:
      "Dragging corpses, dread without mourning, or drama used to avoid change that is already here.",
    readingFunction:
      "Closes a chapter: what must end, be composted, or be renamed to move forward with integrity.",
    compassPrompt:
      "What are you ready to bury with dignity instead of rehearsing forever?",
    extendedKeywords: [
      "form finished with dignity",
      "season refusing encore",
      "grief with vacuum",
      "door locked behind old role",
      "compost as policy",
      "name stripped from habit",
      "last page turned deliberately",
      "what lived gets honored leaving",
      "transition without drag",
    ],
    essenceSentence:
      "A shape of life is ending whether you applaud or not, and what you release cleanly determines how much room the next chapter gets.",
  },
  {
    name: "Temperance",
    slug: "temperance",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["blend", "moderation", "healing", "patience", "integration", "alchemy", "pace"],
    coreMeaning:
      "Two truths can temper each other; the middle path is craft, not cowardice, when done honestly.",
    lightExpression:
      "Measured mixing, recovery, and the art of translating heat into usable warmth over time.",
    shadowExpression:
      "Indecision, spiritual bypass, or balance used to avoid choosing sides when a side must be chosen.",
    readingFunction:
      "Calibrates tone: recovery work, bridging opposites without erasing either truth.",
    compassPrompt:
      "What ingredient is missing for this mix to become medicine instead of dilution?",
    extendedKeywords: [
      "two streams in one cup",
      "temperature under control",
      "recovery chemistry",
      "middle held on purpose",
      "slow mix proving worth",
      "dose not drama",
      "bridge still flexing",
      "proof over rush",
      "tonic not dilution",
    ],
    essenceSentence:
      "Opposites are in the same glass, and the pace you mix at decides whether this becomes healing or a polite way to avoid choosing.",
  },
  {
    name: "The Devil",
    slug: "the-devil",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["bondage", "desire", "pattern", "shadow", "material pull", "taboo", "bargain"],
    coreMeaning:
      "What hooks you is rarely random; repetition reveals appetite and fear holding hands in the dark.",
    lightExpression:
      "Facing appetite honestly, naming bargains, and choosing freedom without shame theatre.",
    shadowExpression:
      "Addiction, secrecy, or power games dressed as inevitability or just how life is.",
    readingFunction:
      "Exposes loops: stuck chemistry, taboo, or short-term relief traded for long-term integrity.",
    compassPrompt:
      "What agreement are you pretending you did not make?",
    extendedKeywords: [
      "hook named in daylight",
      "short relief long invoice",
      "secret handshake costing spine",
      "appetite with a contract",
      "loop wearing your face",
      "taboo as compass",
      "power game with velvet rope",
      "body voting against story",
      "shame priced into habit",
    ],
    essenceSentence:
      "The loop is showing its price tag, and the next honest yes or no decides whether comfort keeps steering or integrity takes the wheel.",
  },
  {
    name: "The Tower",
    slug: "the-tower",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["rupture", "truth", "collapse", "awakening", "disruption", "exposure", "reckoning"],
    coreMeaning:
      "What could not hold finally falls; shock clears room for a truer architecture, willing or not.",
    lightExpression:
      "Sudden honesty, liberation from a lie, and the strange relief of ground that is finally real.",
    shadowExpression:
      "Catastrophising, cruelty, or burning bridges to avoid repairable work you do not want to do.",
    readingFunction:
      "Breaks the frame: shock, exposure, or an external event that rearranges assumptions fast.",
    compassPrompt:
      "What part of this breakdown is information rather than punishment?",
    extendedKeywords: [
      "wall with honesty inside",
      "sudden lateral naming",
      "scaffolding that lied",
      "lightning as editor",
      "structure admitting lie",
      "floor plan revised by shock",
      "liberation with debris",
      "alibi vaporised",
      "audience watching the split",
    ],
    essenceSentence:
      "What could not hold is falling, and the opening it leaves will either teach fast or tempt you to rebuild the same lie with louder materials.",
  },
  {
    name: "The Star",
    slug: "the-star",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["hope", "healing", "guidance", "renewal", "quiet faith", "breathing room", "north"],
    coreMeaning:
      "After heat, a gentler future becomes imaginable; hope returns as a practice, not a mood.",
    lightExpression:
      "Soft optimism, restoration, and the willingness to be seen without performing invulnerability.",
    shadowExpression:
      "Detachment from reality, wishful thinking, or inspiration without the effort that earns it.",
    readingFunction:
      "Reorients: recovery, inspiration, or a north star that steadies the narrative after strain.",
    compassPrompt:
      "What small, repeatable kindness would prove this hope is serious?",
    extendedKeywords: [
      "soft horizon returns",
      "gentle aim after bruising",
      "water on dry ground",
      "promise with ritual behind it",
      "light without glare",
      "repair beginning in public",
      "calm vow after chaos",
      "direction chosen kindly",
      "rest with permission",
    ],
    essenceSentence:
      "A gentler horizon is believable again, and the practices you repeat next decide whether hope becomes shelter or only prettier denial.",
  },
  {
    name: "The Moon",
    slug: "the-moon",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["dream", "uncertainty", "intuition", "fear", "projection", "night", "ambiguity"],
    coreMeaning:
      "The path is real but not fully lit; imagination fills gaps with story unless you test gently.",
    lightExpression:
      "Creative night-work, empathy for fear, and patience with ambiguous signals that still carry data.",
    shadowExpression:
      "Paranoia, gaslighting, or refusing daylight tests for what you suspect because drama feels true.",
    readingFunction:
      "Thickens atmosphere: dreams, hidden motives, or information arriving sideways and symbolically.",
    compassPrompt:
      "What fear are you treating as fact, and what fact are you treating as mood?",
    extendedKeywords: [
      "half-lit trail",
      "mirror fog",
      "story filling empty corners",
      "footsteps not matching echo",
      "suspicion with scenery",
      "symbol instead of receipt",
      "tide in thought rising",
      "sleep logic leaking daytime",
      "path that shimmers",
    ],
    essenceSentence:
      "The trail is real but the lighting is wrong, and what you assume in the gaps will steer you harder than any actual fact on the ground.",
  },
  {
    name: "The Sun",
    slug: "the-sun",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["clarity", "vitality", "joy", "visibility", "truth", "warmth", "simple facts"],
    coreMeaning:
      "What is essential becomes obvious; warmth returns where honesty has room to be ordinary.",
    lightExpression:
      "Simple happiness, health, and the courage to stand in plain sight without apology or disguise.",
    shadowExpression:
      "Blinding certainty, ego glare, or joy used to skip accountability or other people’s reality.",
    readingFunction:
      "Illuminates: success, health, or the part of the story that wants to be public and plain.",
    compassPrompt:
      "What becomes kinder when it is no longer hidden?",
    extendedKeywords: [
      "plain light on faces",
      "success without disguise",
      "facts lounging obvious",
      "vitality without audition",
      "simple story holding water",
      "warmth with accountability",
      "health showing its receipts",
      "being seen without costume",
      "cheer that can still apologise",
    ],
    essenceSentence:
      "What is essential is refusing to stay subtle, and the exposure you accept next decides whether clarity heals or only blinds.",
  },
  {
    name: "Judgement",
    slug: "judgement",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["reckoning", "calling", "renewal", "account", "awakening", "second chance", "voice"],
    coreMeaning:
      "A larger context asks for truth; you hear what your life is trying to become, not only what it was.",
    lightExpression:
      "Forgiveness with backbone, second chances grounded in changed behaviour and honest repair.",
    shadowExpression:
      "Harsh judgment, shame spirals, or noisy rebirth without integration or changed conditions.",
    readingFunction:
      "Sounds the bell: decisions that echo beyond the moment—legacy, vocation, or closure.",
    compassPrompt:
      "What answer, if accepted, would reorganise how you spend the next season?",
    extendedKeywords: [
      "horn at the ribcage",
      "answer you cannot unhear",
      "second draft of a life",
      "legacy knocking",
      "forgiveness with homework",
      "court of your own verdict",
      "rise with changed behaviour",
      "final paragraph rewriting opening",
      "summons with daylight",
    ],
    essenceSentence:
      "A larger bell is ringing, and what you accept or refuse in this hearing will reorganise the season that follows whether you feel ready or not.",
  },
  {
    name: "The World",
    slug: "the-world",
    arcana: "Major Arcana",
    suit: null,
    rank: null,
    keywords: ["completion", "integration", "wholeness", "travel", "arrival", "graduation", "circle"],
    coreMeaning:
      "A cycle completes with dignity; you carry the lesson without dragging the whole set behind you.",
    lightExpression:
      "Maturity, closure with gratitude, and the quiet pride of something finished well enough to release.",
    shadowExpression:
      "Restlessness, premature closure, or success that forgets what it cost other people and you.",
    readingFunction:
      "Completes the arc: graduation, fulfilment, or the last piece clicking into a larger whole.",
    compassPrompt:
      "What would you mark complete so the next chapter can begin clean?",
    extendedKeywords: [
      "spiral ending paid in full",
      "diploma in the weather",
      "journey paid and packed",
      "whole story acknowledged",
      "horizon without loose ends",
      "woven pattern with receipts",
      "return with altered stride",
      "mastery shown as release",
      "last frame fits frame",
    ],
    essenceSentence:
      "A cycle is willing to close with dignity, and what you carry forward—versus what you finally set down—decides how clean the next doorway feels.",
  },
];

const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];

/** Rank layer: archetypal motion inside any suit */
const RANK_LAYER = {
  Ace: {
    stem: "a concentrated opening that has not yet argued for its scale",
    kw: ["seed", "invitation", "first note", "simplicity", "potential"],
    light: "You protect a fragile beginning long enough to hear what it actually wants.",
    shadow: "You confuse novelty with depth, or restart repeatedly without integration.",
    reading: "Initiates the suit's channel: names the proposition arriving before tactics crowd it.",
    compass: "What is honestly new here, and what is only dressed as new?",
  },
  Two: {
    stem: "a pair of pulls negotiating tone—mirror, fork, or quiet standoff",
    kw: ["pairing", "tension", "choice", "balance", "dialogue", "polarity"],
    light: "You let two truths share air without forcing premature collapse into one winner.",
    shadow: "You split, stall, or perform diplomacy while the real decision leaks sideways.",
    reading: "Complicates simplicity: shows where two forces trade weight in the suit's language.",
    compass: "What would change if you named the real fork instead of the polite one?",
  },
  Three: {
    stem: "early collaboration, first visible results, or a small circle forming",
    kw: ["group", "momentum", "exchange", "sprout", "alliance", "first fruit"],
    light: "You share load early enough that trust can grow without heroics or scorekeeping.",
    shadow: "You gossip, triangulate, or rush consensus before competence and care match.",
    reading: "Expands the field: teamwork, networking, or the first credible sign of progress.",
    compass: "Who is actually in this with you, and who is only near the camera?",
  },
  Four: {
    stem: "a shelter, holding pattern, or stability that can comfort or confine",
    kw: ["structure", "rest", "home", "limits", "containment", "pause"],
    light: "You build a container strong enough for honesty to speak without being chased off.",
    shadow: "You fortify against change, confuse comfort with truth, or freeze into routine.",
    reading: "Stabilises: home base, rules, recovery, or the need to catch breath on purpose.",
    compass: "What is this stability protecting—and what is it postponing?",
  },
  Five: {
    stem: "friction, rivalry, or strain where the suit's costs become audible",
    kw: ["conflict", "competition", "loss", "strain", "ego", "scarcity story"],
    light: "You contest cleanly: disagreement becomes information instead of identity warfare.",
    shadow: "You humiliate, hoard, or rehearse injury until the suit turns into a weapon.",
    reading: "Sharpens edges: conflict, setback, or the place the reading cannot stay polite.",
    compass: "What are you fighting for, and what are you only fighting about?",
  },
  Six: {
    stem: "exchange, help, or uneven balance moving between people or phases",
    kw: ["giving", "receiving", "travel", "memory", "fairness", "relay"],
    light: "You let help move in two directions without turning kindness into a ledger of debt.",
    shadow: "You keep score, rescue, or sentimentalise the past to avoid the present task.",
    reading: "Moves energy across distance: aid, return, or the echo of an earlier choice.",
    compass: "Where is generosity honest, and where is it a disguise for control?",
  },
  Seven: {
    stem: "strategy, assessment, or guarded advance while risk stays real",
    kw: ["patience", "stealth", "evaluation", "defence", "planning", "caution"],
    light: "You choose smart patience: protect what matters while still scouting the truth.",
    shadow: "You sneak, scheme, or isolate until paranoia becomes the main character.",
    reading: "Tests nerve: plans, competition, or the need to protect gains without going rigid.",
    compass: "What are you protecting that is still worth the cost of protection?",
  },
  Eight: {
    stem: "craft, repetition, or narrowed focus where skill replaces noise",
    kw: ["skill", "discipline", "detail", "rhythm", "mastery path", "refinement"],
    light: "You commit reps: small correct moves stack into something you can trust under pressure.",
    shadow: "You grind without aim, micromanage, or hide in busywork to avoid a harder edge.",
    reading: "Deepens technique: diligence, apprenticeship, or the grind that changes quality.",
    compass: "What part of this work is refinement, and what part is avoidance?",
  },
  Nine: {
    stem: "near-completion, fatigue, or intensity before the last threshold",
    kw: ["almost", "weariness", "alertness", "boundary", "solo stand", "grit"],
    light: "You hold the line with limits: enough is named, and rest becomes strategic, not guilty.",
    shadow: "You white-knuckle, isolate, or dramatise burden so no one can offer real help.",
    reading: "Raises stakes: stamina, anxiety, or the lone watch before resolution arrives.",
    compass: "What would make this intensity meaningful instead of heroic suffering?",
  },
  Ten: {
    stem: "fullness, culmination, or carrying the suit's weight to its logical edge",
    kw: ["completion", "legacy", "burden", "saturation", "inheritance", "end of line"],
    light: "You accept the harvest, pay the tab, and let the cycle show its total honestly.",
    shadow: "You collapse under story, overload others, or call burnout destiny.",
    reading: "Completes a suit-run: outcomes land, debts surface, or the pattern shows its sum.",
    compass: "What is ready to be finished so the next cycle does not start poisoned?",
  },
  Page: {
    stem: "a learner's signal—message, curiosity, or early style testing the waters",
    kw: ["study", "message", "curiosity", "beginner", "probe", "youthful signal"],
    light: "You ask sincere questions and risk looking new instead of pretending mastery.",
    shadow: "You perform cleverness, scatter attention, or treat gossip as intimacy.",
    reading: "Carries news: invitations, study, or a fresh voice entering the situation.",
    compass: "What is this message trying to teach you before you decide how you feel about it?",
  },
  Knight: {
    stem: "charged motion: pursuit, campaign, or style pushed toward an object",
    kw: ["charge", "mission", "velocity", "style", "campaign", "nerve"],
    light: "You aim energy with purpose and accept the cost of being seen moving.",
    shadow: "You charge past context, burn bridges, or confuse intensity with truth.",
    reading: "Accelerates plot: pursuit, argument, travel, or a push that changes tempo fast.",
    compass: "What are you rushing toward—and what are you rushing away from?",
  },
  Queen: {
    stem: "mature holding: discernment, care, and inward authority in the suit",
    kw: ["depth", "containment", "discernment", "care", "interiority", "standards"],
    light: "You tend the field without stealing agency; warmth includes honest boundaries.",
    shadow: "You freeze others with mood, smother with help, or withdraw as punishment.",
    reading: "Stabilises emotionally: mentorship, standards, or the seat that steadies the room.",
    compass: "Where does care become clarity, and where does it become control?",
  },
  King: {
    stem: "visible stewardship: mastery, responsibility, and outward authority in the suit",
    kw: ["authority", "command", "experience", "protection", "legacy", "visibility"],
    light: "You lead from earned pattern: rules serve people, not the other way around.",
    shadow: "You dominate, dismiss doubt, or confuse control with protection.",
    reading: "Sets tone at the top: leadership, policy, or the final word the spread keeps returning to.",
    compass: "What would leadership here protect without shrinking anyone else's reality?",
  },
};

/** Suit layer: how the rank's motion expresses in Wands / Cups / Swords / Pentacles */
const SUIT_LAYER = {
  Wands: {
    lens: "creative will, spark, and the courage to be seen trying before the map is perfect",
    pull: "impulse tests whether heat can become direction without burning trust for fuel",
    kw: ["fire", "drive", "experiment", "visibility", "nerve"],
    lightFit: "You steer heat into craft and let enthusiasm carry responsibility, not excuses.",
    shadowFit: "You perform urgency, pick fights with boredom, or chase novelty to dodge depth.",
    readingFit: "It weights motive, creative friction, and how courage meets consequence in the spread.",
    compassFit: "motive and creative risk",
  },
  Cups: {
    lens: "feeling-tone, bonding, and the heart's need for truth that can be lived with another person",
    pull: "emotion seeks shelter, reciprocity, and language before it hardens into a fixed plot",
    kw: ["water", "intimacy", "attunement", "memory", "tenderness"],
    lightFit: "You let feeling inform choice without drowning sense in mood or fantasy.",
    shadowFit: "You merge, manipulate with need, or sentimentalise the past to avoid the present.",
    readingFit: "It colours attachment, empathy, and what the reading refuses to pretend is neutral.",
    compassFit: "bonding and emotional truth",
  },
  Swords: {
    lens: "mind, edge, and the cost of naming what is sharp, unfair, or overdue",
    pull: "clarity presses for language that cannot stay polite once consequences are seen plainly",
    kw: ["air", "edge", "truth", "speech", "consequence"],
    lightFit: "You speak cleanly, cut kindly, and let disagreement refine rather than destroy.",
    shadowFit: "You weaponise facts, spiral in thought, or confuse cynicism with intelligence.",
    readingFit: "It clarifies argument, anxiety, and the ideas or words actively reshaping the situation.",
    compassFit: "clarity and the price of honesty",
  },
  Pentacles: {
    lens: "body, craft, resources, and the slow evidence of what can be built or repaired",
    pull: "material reality asks for stewardship, patience, and respect for limits you cannot debate away",
    kw: ["earth", "labour", "resource", "skill", "ground"],
    lightFit: "You honour small dependable steps and let money, health, or work speak plainly.",
    shadowFit: "You hoard, compare, or equate worth with output until rest feels like failure.",
    readingFit: "It grounds outcomes in work, health, money, and what the hands and calendar actually allow.",
    compassFit: "resources and embodied effort",
  },
};

/** Rank-based extra phrases for minors (filtered per card against its five keywords). */
const RANK_EXTEND_PHRASES = {
  Ace: [
    "threshold before habit hardens",
    "hand still hovering on the first move",
    "ink not yet dry on the promise",
    "scale still unargued aloud",
    "leaning yes without rehearsal",
    "opening you could still walk back",
    "thin margin for bluffing",
    "gesture still bi-directional",
    "proof still downstream somewhere",
    "moment before repetition locks in",
    "heat without a contract yet",
    "curiosity parked at the edge",
  ],
  Two: [
    "mirror without a crown",
    "polite standoff charge",
    "two clocks disagreeing softly",
    "fork that will not stay polite on paper",
    "conversation circling blame",
    "paper coalition shaking",
    "truce still unsigned",
    "negotiation sharing one doorway",
    "parallel stories sharing oxygen",
    "either-or with witnesses",
    "hands still hovering over pen",
    "middle seat getting warm",
  ],
  Three: [
    "first cohort showing stripes",
    "network tightens around proof",
    "coalition testing its legs",
    "visible ripple after huddle",
    "shared load on crisper terms",
    "small win echoing wide",
    "bandwidth stretched with newcomers",
    "early chorus off-key but loud",
    "coordination with scuffed corners",
    "crew learning each other's tells",
    "table expands before rules catch up",
    "signal boosting through friendship",
  ],
  Four: [
    "walls that soothe and confine",
    "domestic clock slowing drama",
    "roof holding louder feelings",
    "cellar door opened on purpose",
    "recovery under same ceiling",
    "rules printed on the fridge",
    "stillness with a deadline",
    "comfort pricing honesty",
    "hold pattern with teeth",
    "refuge costing visibility",
    "same four walls new verdict",
    "shelter auditioning for permanence",
  ],
  Five: [
    "bruised pride at the table",
    "edges sharpening between allies",
    "cost spoken where small talk failed",
    "injury wearing a polite mask",
    "win tasting sour after bell",
    "arena shrinking around vanities",
    "public sting of falling behind",
    "pushing below civility",
    "ledger asks who bleeds",
    "rivalry sniffing daylight",
    "crowd splitting into camps",
    "bruise map on old friendship",
  ],
  Six: [
    "aid over distance with strings",
    "favor echoing older chapter",
    "return shipment of feelings",
    "debt dressed as generosity",
    "visit shifting household weather",
    "passing the hat with eyes up",
    "memory rerouting present cash",
    "relay handoff at midnight",
    "return ticket emotionally cashed",
    "exchange rate for tenderness",
    "parcel arrives with old handwriting",
    "help that rearranges the room",
  ],
  Seven: [
    "scout moves while flank guarded",
    "quiet audit in dim light",
    "maps drawn with pencil first",
    "perimeter tighter without drama",
    "reading rival from silhouette",
    "reserve shots for later street",
    "risk step veiled in small talk",
    "calculated retreat not surrender",
    "measuring twice before noise",
    "glance counting exits mid toast",
    "notebook margins full of arrows",
    "silence used as reconnaissance",
  ],
  Eight: [
    "repetition crowning the lesson",
    "micro adjustments under fatigue",
    "bench hours compounding silently",
    "pixel polish before reveal",
    "same route until muscle agrees",
    "grunt work buying credibility",
    "narrowed craft under deadline",
    "hands memorising sequence",
    "quiet grind erasing excuses",
    "drill sergeant inner voice softened",
    "stacked reps rewriting story",
    "boring excellence saving the day",
  ],
  Nine: [
    "solo watch with coffee tremor",
    "threshold fraying kindness",
    "last lap nervous system loud",
    "alertness borrowing from sleep",
    "shoulders mapped to doorway",
    "one lamp left in corridor",
    "threshold sweat without badge",
    "waiting backstage past call time",
    "nerves humming at edge",
    "solo stance hairline cracked",
    "closing lap refusing applause",
    "midnight oil with frayed wick",
  ],
  Ten: [
    "harvest table groaning literal",
    "check signed with shaking wrist",
    "estate landed with strings",
    "sum line heavier than story",
    "pattern refusing encore politely",
    "crowd dispersing with debt noted",
    "final chord still ringing ribs",
    "tally closing like heavy gate",
    "aftermath settling like dust",
    "closing credits over honest wreckage",
    "season invoice slid across table",
    "weight of what you asked for",
  ],
  Page: [
    "knock at mentor window dusk",
    "note passed with shaky script",
    "rookie voice testing volume",
    "invitation with training wheels",
    "question marks on fresh paper",
    "pilot episode nervously filmed",
    "first rehearsal over daylight",
    "new handle still squeaking door",
    "kid messenger panting truth",
    "scout report half crossed out",
    "ink smudge where courage stalled",
    "sideways question at full volume",
  ],
  Knight: [
    "cavalry leaning toward horizon",
    "steed breathing louder than plan",
    "dust plume ahead of map",
    "lance aimed at restless rumor",
    "saddle cinched toward storm wall",
    "pursuit louder than rationale",
    "gallop sharpening night noise",
    "banner curling at frayed edge",
    "rider squinting through heat shimmer",
    "errand ballooned into crusade",
    "road narrowed to knife light",
    "hooves answering prior dare",
  ],
  Queen: [
    "calm eye in noisy orbit",
    "expectations etched on velvet",
    "holding court without stealing mics",
    "gravitas poured into measured pour",
    "kitchen wisdom with paperwork",
    "quiet veto under red lipstick",
    "cool water passed around room",
    "interior weather predicting squall",
    "circle trusts her raised brow",
    "mentorship with velvet rope rule",
    "glance that resets the agenda",
    "warmth priced in honest limits",
  ],
  King: [
    "signature line ending debate",
    "policy printed over old scars",
    "throne room smell of toner",
    "proverb quoted instead of joke",
    "jurisdiction settling the music",
    "oar callused steering city ship",
    "mantle heavy with precedent",
    "shelter priced in favors owed",
    "inheritance microphone feedback hum",
    "crown tilts listening for riot",
    "ledger mind behind public smile",
    "final stamp cooling on desk",
  ],
};

/** Suit-based extra phrases for minors (filtered per card against its five keywords). */
const SUIT_EXTEND_PHRASES = {
  Wands: [
    "spark in hallway not lab",
    "heat rising in meeting notes",
    "creative dare taped to mirror",
    "burner left on after speech",
    "appetite drumming tabletop",
    "torch passed with singed sleeves",
    "impulse leaning on doorway",
    "embers under polished speech",
    "wired adrenaline before sleep",
    "wild draft circled twice red",
    "restless sketch on napkin back",
    "match strike in quiet hallway",
  ],
  Cups: [
    "salt rim on shared glass",
    "echo chamber softened by hand",
    "afterparty tears without shame",
    "wet eyes at kitchen light",
    "slow dance with ugly truth",
    "keepsake pressed into palm",
    "bathtub confession almost aired",
    "message draft unsent pulsing",
    "silence filled by held breath",
    "wine stain shaped like map",
    "toast that catches in throat",
    "rain on window during argument",
  ],
  Swords: [
    "cross talk sharpening quietly",
    "glance that files lawsuit internally",
    "memo blade between friendly lines",
    "syntax doing violence kindly",
    "office air thinner near window",
    "argument rehearsed in shower",
    "whisper chain gains gravity",
    "incisive joke nobody laughs at",
    "paper cut truth at checkout",
    "metaphor sharpened too far",
    "subtext wearing steel toe boots",
    "keyboard clicks like rainfall",
  ],
  Pentacles: [
    "ledger ink still damp",
    "calendar refusing romance",
    "hands smelling of honest steel",
    "savings jar shaken nightly",
    "kitchen table math tense",
    "overtime deciding romance",
    "callus map of last quarter",
    "rent due with moral asterisk",
    "apron pocket full of receipts",
    "shoulder ache priced honestly",
    "paystub theology at midnight",
    "toolbox heavier than ambition",
  ],
};

const MINOR_ESSENCE_RANK = {
  Ace: "An untested proposition lands,",
  Two: "Two honest pulls share one room,",
  Three: "A small circle shows first visible motion,",
  Four: "Shelter and limit arrive as one package,",
  Five: "Friction names the bill the storyline hid,",
  Six: "Giving and receiving lean across distance,",
  Seven: "Defence and scouting share the watch,",
  Eight: "Repetition replaces inspiration as teacher,",
  Nine: "Fatigue and alertness trade the night shift,",
  Ten: "The tally lands and refuses nostalgia,",
  Page: "A young signal asks for practice not polish,",
  Knight: "Momentum picks a target and accepts cost,",
  Queen: "Depth steadies the field without stealing voices,",
  King: "The last word sets what the room will tolerate,",
};

const MINOR_ESSENCE_SUIT = {
  Wands: "while creative nerve decides whether heat earns direction or only damage control.",
  Cups: "while emotional honesty decides whether tenderness deepens or hardens into plot.",
  Swords:
    "while language and consequence race, trimming what can still be mended if named cleanly now.",
  Pentacles: "while the ledger, body, and calendar insist on proof over posture.",
};

const EXTENSION_FALLBACK = [
  "pressure testing daily nerve",
  "clock asking for a receipt",
  "quiet audience assembling",
  "underfoot shift in the math",
  "habit louder than good intention",
  "space for one honest verdict",
  "signal arrives before consensus",
  "weather inside the room changes",
  "argument cooling toward fact",
  "kindness with paperwork attached",
  "bruise you keep explaining away",
  "door that locks from both sides",
  "promise wearing thin at hem",
  "silence bought on installment",
  "table set for harder news",
  "mirror held without flinching",
  "patience taxed without interest",
  "story tightening around ankles",
  "hands busy to dodge the heart",
  "laughter thinner near midnight",
  "threshold wet with hesitation",
  "schedule flexing around grief",
  "truth parked outside polite talk",
  "nerve auditioning for backbone",
  "costume thread snagging on nail",
  "old vow tapping the microphone",
];

function minorEssenceSentence(rank, suit) {
  const head = MINOR_ESSENCE_RANK[rank];
  const tail = MINOR_ESSENCE_SUIT[suit];
  if (!head || !tail) {
    return "A movable moment in the spread: watch how tone shifts when another card answers this one.";
  }
  return (head + " " + tail).replace(/\s+/g, " ").trim();
}

function phraseConflictsKeywords(phrase, keywords) {
  const pl = phrase.toLowerCase();
  for (const raw of keywords) {
    const k = String(raw).toLowerCase().trim();
    if (!k) continue;
    if (pl === k) return true;
    if (k.includes(" ")) {
      if (pl.includes(k)) return true;
    } else {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
      if (re.test(pl)) return true;
    }
  }
  return false;
}

function buildMinorExtendedKeywords(rank, suit, keywords) {
  const rp = RANK_EXTEND_PHRASES[rank] || [];
  const sp = SUIT_EXTEND_PHRASES[suit] || [];
  const merged = [...rp, ...sp];
  const seen = new Set();
  const out = [];
  for (const phrase of merged) {
    const p = String(phrase).trim();
    if (!p) continue;
    const low = p.toLowerCase();
    if (seen.has(low)) continue;
    if (phraseConflictsKeywords(p, keywords)) continue;
    seen.add(low);
    out.push(p);
    if (out.length >= 12) break;
  }
  let fi = 0;
  while (out.length < 8 && fi < EXTENSION_FALLBACK.length) {
    const p = EXTENSION_FALLBACK[fi++];
    const low = p.toLowerCase();
    if (seen.has(low)) continue;
    if (phraseConflictsKeywords(p, keywords)) continue;
    seen.add(low);
    out.push(p);
  }
  return out.slice(0, Math.min(12, out.length));
}

function uniqKeywords(...groups) {
  const out = [];
  const seen = new Set();
  for (const g of groups) {
    for (const w of g) {
      const k = w.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(w);
      }
    }
  }
  return out.slice(0, 5);
}

/** Ensure every exported card has five keywords and a single core sentence (tool contract). */
function ensureFiveKeywords(kw) {
  const arr = Array.isArray(kw) ? kw : [];
  const seen = new Set();
  const out = [];
  for (const w of arr) {
    const s = String(w).trim();
    if (!s) continue;
    const low = s.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(s);
    if (out.length >= 5) break;
  }
  const pad = ["undercurrent", "timing", "relation", "pressure", "stillpoint"];
  let i = 0;
  while (out.length < 5 && i < pad.length) {
    const p = pad[i++];
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out.slice(0, 5);
}

const CORE_FALLBACK =
  "A movable position in the spread: notice how this card alters tone when it answers another card, not when it stands alone.";

function normalizeExportCard(c) {
  const core =
    c.coreMeaning && String(c.coreMeaning).trim()
      ? String(c.coreMeaning).trim()
      : CORE_FALLBACK;
  return {
    ...c,
    keywords: ensureFiveKeywords(c.keywords),
    coreMeaning: core,
  };
}

function buildMinorArcana() {
  const out = [];
  for (let s = 0; s < SUITS.length; s++) {
    const suit = SUITS[s];
    const sv = SUIT_LAYER[suit];
    for (let r = 0; r < RANKS.length; r++) {
      const rank = RANKS[r];
      const rv = RANK_LAYER[rank];
      const name = `${rank} of ${suit}`;
      const slug = `${rank.toLowerCase()}-of-${suit.toLowerCase()}`;
      const coreMeaning = `The ${name} marks ${rv.stem} along ${sv.lens}: ${sv.pull}.`;
      const lightExpression = `${rv.light} ${sv.lightFit}`;
      const shadowExpression = `${rv.shadow} ${sv.shadowFit}`;
      const readingFunction = `${rv.reading} ${sv.readingFit}`;
      const compassPrompt = `What does ${name} ask you to notice about ${sv.compassFit} before you rush to label what it means?`;
      const keywords = uniqKeywords(rv.kw, sv.kw, [suit.toLowerCase(), rank.toLowerCase()]);
      const extendedKeywords = buildMinorExtendedKeywords(rank, suit, keywords);
      const essenceSentence = minorEssenceSentence(rank, suit);
      out.push({
        name,
        slug,
        arcana: "Minor Arcana",
        suit,
        rank,
        keywords,
        coreMeaning,
        lightExpression,
        shadowExpression,
        readingFunction,
        compassPrompt,
        extendedKeywords,
        essenceSentence,
      });
    }
  }
  return out;
}

export const tarotCards = [...MAJORS, ...buildMinorArcana()].map(normalizeExportCard);
