export type StudioLesson = {
  focus: string;
  method: readonly [string, string, string];
  workingExample: string;
  review: string;
};

// Editorial teaching content is separate from creator records. Locked weeks are
// never sent in the rendered page until their programme date arrives.
export const STUDIO_LESSONS: Record<number, StudioLesson> = {
  1: {
    focus: "A deck promise is a design constraint, not a slogan. Name a particular reader or recipient, the moment in which they will use the deck, and the change in understanding or practice it can reasonably offer. A private family gift and a retail oracle can both be rigorous, but they make different demands on instructions, testing and production. Write the promise in ordinary language before deciding how to market it.",
    method: [
      "Describe one real use occasion. Who opens the box, what question are they carrying, and what should they be able to do after drawing a card? Avoid an audience so broad that it cannot guide a choice.",
      "Write a one-sentence promise with a verb the deck can fulfil: notice, reflect, practise, remember or decide. Then name two things the deck does not promise. This boundary protects the writing from inflated claims.",
      "Put the promise beside three possible cards. If a card could belong in any unrelated deck without changing, identify the missing connection to your purpose. Record what evidence or testing would show that the intended reader understands it.",
    ],
    workingExample: "A deck for new gardeners might promise to help someone notice seasonal changes and choose a small next action. It cannot promise that every planting will succeed. That distinction shapes the observations, images and instructions on each card.",
    review: "Keep the reader, occasion and promise in the project record. Ask a person outside the project to say back what the deck is for. If their answer differs materially, revise the promise or the explanation before expanding the card list.",
  },
  2: {
    focus: "Architecture is the agreement between a deck and its reader. A tarot deck carries recognisable structural expectations; an oracle may invent its own; a hybrid must state which conventions it keeps and which it changes. Choose structure for the interpretive work it enables, rather than choosing a number because it feels familiar.",
    method: [
      "List the recurring distinctions the reader must be able to recognise. These may be stages, elements, places, relationships or types of action. Decide which require a family, which belong inside a card, and which are better explained in the guidebook.",
      "Make a one-page architecture rule: planned size, families, sequence, card naming, numbering and how a reading moves across the system. Mark inherited tarot conventions explicitly if you use them, so originality does not create a false expectation of a standard tarot structure.",
      "Stress-test the rule with three unlike examples: an opening card, a difficult or ambiguous card, and a closing or integrating card. If the rule cannot contain all three without exceptions you cannot explain, change the rule now.",
    ],
    workingExample: "A hybrid deck can use suit-like families without claiming to reproduce tarot. Its guidebook should explain the family logic and any departures before readers try to infer meanings from familiar suit names.",
    review: "Show the architecture to a prospective reader. Ask how they would find a card and how they think the system develops. Record misunderstandings as design evidence, not as a failure by the reader.",
  },
  3: {
    focus: "A whole-deck view reveals a different problem from a strong individual card. Count, sequence and family balance expose repetition, missing transitions and endings that have not been earned. The goal is a deliberate system, not equal numbers in every family.",
    method: [
      "Place every proposed card in the whole-deck dashboard with a working title and one-line job. Leave uncertain cards visibly unassigned instead of silently forcing them into the nearest family.",
      "Scan adjacent cards for the movement between them. Mark where a reader must make a conceptual leap, where two cards perform the same job, and where a family grows because a subject is familiar rather than necessary.",
      "Draw a test reading of three cards from different positions. Can you explain why each card is distinct, how they can coexist, and what the sequence contributes? Keep the useful tension; remove accidental duplication.",
    ],
    workingExample: "Two cards named Rest and Pause can be distinct if one concerns bodily recovery and the other suspends a decision. If both give the same instruction, a change of illustration will not solve the editorial duplication.",
    review: "Record one gap, one repeat and one intentional contrast. Decide whether each requires a new card, a changed brief or a guidebook explanation. Do not commission a full image set while the card jobs are still moving.",
  },
  4: {
    focus: "A repeatable card framework is an editorial contract with yourself and future collaborators. It makes omissions visible without making every card sound alike. Separate what the reader needs in the finished edition from private research, artwork instructions and rights evidence.",
    method: [
      "Choose the smallest required set for a usable card: title, core meaning, image or symbolic logic, practical reading guidance, and any caution that changes interpretation. Add optional fields only when they answer a recurring project question.",
      "Write a representative card from start to finish using the same field order you intend to use across the deck. Keep sources and permissions in private fields, and link the card to its guidebook section rather than copying evolving text between two places.",
      "Try the template on a card that resists it. If the framework forces a false symmetry, revise the template. If a field is consistently empty, ask whether it is truly required or whether the draft needs more research.",
    ],
    workingExample: "A card about Threshold may need a short meaning and a precise question for the reader. Its unpublished research on a doorway tradition and an artist's crop notes belong in separate fields with their own status.",
    review: "Compare two trial cards side by side. A reader should find the same kinds of information quickly while still hearing each card's own voice. Record which fields are required for your pathway and why.",
  },
  5: {
    focus: "Interpretive depth comes from a traceable relationship between image, observation, meaning and reader action. A striking metaphor is not sufficient if the reader cannot tell what to do with it. Distinguish a claim about the world from an invitation to reflect.",
    method: [
      "Choose three representative cards with different emotional tones. For each, name what is visibly present, the interpretation you draw from it, an alternative reading, and the practical question the card offers the reader.",
      "Read the cards aloud. Remove repeated openings and stock language that could move between cards without loss. Keep a distinctive turn of phrase when it makes an interpretive distinction clearer, not merely when it sounds impressive.",
      "Qualify any psychological, bodily or cultural mechanism that the card has not established. Preserve the useful observation while making the scope honest. A reader can be guided without being told that a symbolic association proves a universal fact.",
    ],
    workingExample: "An image of a tide withdrawing can invite a reader to notice what has become visible in its absence. It does not establish that every loss has a hidden benefit. The first statement opens inquiry; the second overrides lived experience.",
    review: "Give someone the card and its image without your verbal explanation. Ask what they understood and where they needed more context. Use the answer to improve the card or guidebook, rather than coaching the test reader toward your intent.",
  },
  6: {
    focus: "Research integrity is a series of decisions, not a bibliography added at the end. Separate your own observation from a sourced fact, a quotation, inherited knowledge, cultural context and a permission still to be obtained. The burden of evidence rises when a claim is specific or an image uses another person's work.",
    method: [
      "For one card, annotate every factual or borrowed element. Record the source creator, work, date or URL, what you used, and whether the source supports the precise wording. Put unresolved evidence in a visible status rather than deleting the question.",
      "Make a permissions register for images, text, names and culturally situated knowledge. Identify who can grant permission, what uses are covered, and whether the intended print, digital and promotional editions differ.",
      "Choose an editorial response for each open issue: substantiate, attribute, seek permission, rewrite as personal interpretation, or omit. A private edition may still need care, while a commercial edition also needs documented rights before investment in print.",
    ],
    workingExample: "A bird's documented habitat may come from a field guide; a spiritual association may be the creator's own interpretation; a whakataukī has a distinct source and context. Those three statements should not be presented as though they carry the same kind of authority.",
    review: "Select one unresolved item and name the person or source that could settle it, the decision deadline and the fallback if it cannot be resolved. Do not move an unresolved rights assumption into a production specification as if it were approved.",
  },
  7: {
    focus: "Artwork must work as a system at its final size, not only as individual full-screen images. A useful brief connects symbolic purpose, visual consistency, technical delivery and rights. The creator and artist should know which decisions are fixed, which invite interpretation, and who approves changes.",
    method: [
      "Write a visual system sheet with palette, composition range, typography boundary, recurring motifs, legibility at card size, and the relationship between card face, back, box and guidebook. Include deliberate exceptions.",
      "Prepare one representative brief. Specify the card's interpretive job, required and excluded imagery, references with rights status, dimensions, bleed, file format, colour requirements and review milestones. Ask an artist to identify what is ambiguous.",
      "Record ownership and permitted uses for sketches, final art, promotional crops and future editions. If generative tools participate, state the process accurately and decide how it affects the commercial and ethical promise of the deck.",
    ],
    workingExample: "A beautiful landscape cropped to a narrow card may lose the feature the writing depends on. Test the composition inside the actual trim and safe area before accepting the illustration as complete.",
    review: "Compare a strong card image, a weak one and the proposed card back at print scale. Note which difference is intentional, which is a system failure, and what the artist needs before the next approval round.",
  },
  8: {
    focus: "Testing asks whether the deck can be used without its creator in the room. Editorial testing, interpretive testing and production testing answer different questions. Choose participants and tasks that resemble the intended reader and use occasion rather than seeking general praise.",
    method: [
      "Give a tester an image, card text and the relevant guidebook entry. Ask them to perform a small reading, explain their next step and mark any term they could not use without your explanation. Record their words before giving your interpretation.",
      "Review the whole deck for repeated card jobs, uneven voice, missing counterexamples and contradictory guidance. Separate structural findings from copy edits. A polished sentence should still be changed if it carries the wrong job.",
      "Track each finding with severity, source and resolution. Test a revised sample with someone who has not heard the first explanation. Keep dissenting feedback when it reveals an audience boundary rather than treating all disagreement as a defect.",
    ],
    workingExample: "If three testers read a card as a warning while the creator intended permission to rest, examine the image and first sentence together. A longer guidebook defence may not repair the first encounter.",
    review: "Record one finding that changed the deck, one that changed only the instructions, and one that you deliberately kept. State why each decision serves the promise set in week one.",
  },
  9: {
    focus: "The guidebook is a reading journey and a production object. Its structure must help a newcomer start, find a card, understand the system and return for depth. The same manuscript also has a page count, format and physical cost. Plan those realities together.",
    method: [
      "Make a table of contents with front matter, a concise first-use path, reading instructions, card entries, credits and closing material. State what belongs on the card, in the guidebook and in private research so copy is not duplicated without purpose.",
      "Link each card to its guidebook entry and check the relationships both ways. Count entries, mark missing sections and test navigation with a reader searching for a card by number, title and family.",
      "Estimate space using a sample of short, medium and long entries in the intended page size. Include images, margins, typography and binding constraints before treating a word count as a printer-ready page count.",
    ],
    workingExample: "A 78-card deck with two pages for every entry requires 156 pages before instructions, acknowledgements or blank leaves. That rough count can change box dimensions and unit cost before a designer has laid out a single page.",
    review: "Export the manuscript and scan the actual section order. Ask a new reader to find an unfamiliar card and follow the reading instructions. Record navigation problems and missing context in the guidebook workspace.",
  },
  10: {
    focus: "A prototype is a test of specified decisions, not a ceremonial first copy. A quote is only comparable when suppliers price the same components, quantity, finish, files, freight assumptions and proofing steps. Keep the specification measurable while allowing materials to change after evidence arrives.",
    method: [
      "Write the edition specification: card count and trim, stock and finish, printing sides, rounded corners, box type, guidebook format, quantities, packaging and delivery location. Mark each dimension as confirmed, estimated or unresolved.",
      "Prepare an artwork and file handoff with bleed, safe area, colour profile, minimum resolution, font treatment, naming and proof responsibility. Test one card, one dense guidebook page and one packaging panel at physical size.",
      "Ask at least two suppliers the same bounded questions, including tooling, proof cost, tolerances, substitutions, lead time and freight. Capture quote date and validity. If only one route is practical, record why instead of inventing a comparison.",
    ],
    workingExample: "Two prices for 500 decks are not comparable when one includes a printed booklet and delivery and the other covers loose cards collected from a factory. Normalize components before comparing the total.",
    review: "Record what the prototype changed and which question must be answered before approving a production run. A personal edition may use a small-batch method; a public promise needs a repeatable specification.",
  },
  11: {
    focus: "Price and funding decisions depend on landed cost, not the printer's unit price alone. Separate fixed costs from per-unit costs and from costs that vary by destination. A useful model shows assumptions and scenarios so a changed print run or shipping quote does not make the decision opaque.",
    method: [
      "Record print, artwork, design, proofing, packaging, freight, taxes and platform or payment fees with their source and currency. Note which figures are quotes, estimates or allowances and whether the amount is fixed, per deck or per order.",
      "Calculate a low, expected and high scenario at the quantities you might actually make. Include returns, damaged copies and contingency. Test the price against the full cost and the sales channel rather than choosing a margin from a single manufacturing figure.",
      "Map fulfilment: storage, picking, packing, shipping zones, customs assumptions and who handles customer questions. For crowdfunding, connect reward tiers and a funding goal to the same evidence rather than treating gross pledges as available cash.",
    ],
    workingExample: "A lower unit print price at 1,000 copies can be more expensive overall than 300 copies if cash, storage and unsold stock outweigh the saving. Compare total commitment and break-even quantity, not just the unit quote.",
    review: "Write the largest unknown financial variable in the production plan and the quote or test that will reduce it. Keep uncertain tax and cross-border treatment open for qualified advice before taking payments.",
  },
  12: {
    focus: "A release decision is an evidence review. A compelling story should be supported by a usable deck, a tested edition, rights you can exercise and a fulfilment plan you can carry out. The personal, independent and commercial pathways may choose different publication assets without lowering the standard of honesty.",
    method: [
      "Assemble a story spine: why this deck exists, what changed during development, how it works and who it is for. Select only process excerpts or images you have deliberately cleared to share; the private journal remains private.",
      "Make an asset register for product description, images, demonstrations, guidebook sample, credits, specifications, pricing, fulfilment terms and support enquiries. Name the owner and approval state of each asset.",
      "Hold a go, revise or pause review. Check manuscript and image rights, a complete prototype, legible instructions, cost and fulfilment evidence, and the promise made to the intended reader. Write the decision, unresolved risks and the next date for review.",
    ],
    workingExample: "A creator can decide to make ten gifts now and postpone a retail edition. That is a completed personal pathway, not a failed commercial launch. The recorded decision preserves the work needed for a later edition.",
    review: "Export the project and production record, then ask whether another person could reconstruct the current deck, its ownership position and its next production decision. If not, fill the missing record before announcing a date.",
  },
};
