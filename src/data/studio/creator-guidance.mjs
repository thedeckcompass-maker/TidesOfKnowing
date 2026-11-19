// Adapted from the November 14 parallel landing and FAQ review. Commercial
// programme terms remain in the existing versioned offer contract.
export const faqSections = [
  { id: 'studio', title: 'The Studio and your project', questions: [
    ['What is Deck Creator Studio?', 'Deck Creator Studio brings your concept, cards, visual direction, guidebook and publication planning together in one creative workspace.'],
    ['What kinds of decks can I develop?', 'You can develop tarot, oracle, reflective, educational and other card-based projects around the experience you want to create.'],
    ['Do I need finished artwork to begin?', 'No. You can begin with an idea, writing or visual references and develop your direction as your work takes shape.'],
    ['Do I need publishing or design experience?', 'You can begin with an idea, notes or visual material. Use the Studio to develop your concept, structure and writing, and choose human guidance according to your project and the applicable program terms.']
  ]},
  { id: 'explore', title: 'Start with Explore', questions: [
    ['What can I do with free Explore?', 'Explore is an ongoing free starting point for an active registered member. Work on one active project with up to ten active cards, and return to your saved work.'],
    ['What happens when I reach ten cards?', 'You can keep editing your existing cards. Deleting a card releases a place for another, and Create offers more room to develop.'],
    ['Can I move to Create later?', 'Yes. Your existing creative work remains yours when you upgrade.'],
    ['Can I replace cards and keep returning to my work?', 'Yes. Explore is a capacity limit, not a lifetime creation allowance. Save and revisit your project, revise existing cards as often as you need, or delete a card to free a place. Restoring a deleted card requires an available place.']
  ]},
  { id: 'support', title: 'Choose your support', questions: [
    ['How do the Studio pathways differ?', 'Explore is a free starting point. Create provides a paid independent workspace. Collaborate and Develop add different levels of editorial support. Review the current pathway information before choosing.'],
    ['What kind of editorial help is available?', 'Supported pathways offer human editorial guidance. The scope and availability of services depend on the terms of your particular program.'],
    ['Can I ask for help choosing?', 'Contact Tides of Knowing with a brief description of your project and the support you are considering.'],
    ['What happens in a private consultation?', 'Bring a completed card draft or a focused question about your concept, structure or writing. Human editorial feedback helps you develop your own voice and approach. A consultation or written review is not a full-manuscript edit.'],
    ['Can I change pathways or obtain additional help?', 'Discuss the support your project now needs with Leilia. Additional editorial work can be separately scoped and quoted. Agree any pathway or payment change before proceeding; existing purchases retain their recorded terms.']
  ]},
  { id: 'ownership', title: 'Your work and publication', questions: [
    ['Who owns my creative work?', 'You retain ownership of your original creative work. You are responsible for securing permission for any third-party material you include.'],
    ['Can I export my work?', 'The Studio offers authorized exports for your work. Available formats depend on your access and the material being exported; check the export options in your project.'],
    ['Is a Community post the same as my project?', 'No. Your project and a Community contribution are separate. Choose what material you want to share in a discussion.'],
    ['Who handles artwork, printing and other project costs?', 'You are responsible for permissions and any agreements with artists, printers or publishers. Discuss supplier requirements before committing to production; Studio membership does not itself commission artwork or pay external suppliers.'],
    ['Are working exports finished printer files?', 'Working exports support review, further editing and publication planning. They are not certified print-ready files. Check your printer’s specifications, retain full-resolution originals and review a physical proof before production.']
  ]}
];

// Keep anonymous Explore entry distinct from returning-member sign-in.
export function studioExploreHref(authenticated) {
  return authenticated ? '/studio/account/' : '/auth/register/?mode=join&redirectTo=%2Fstudio%2Faccount%2F';
}

export const walkthroughSteps = [
  { title: 'Choose your starting point', body: 'Explore is free. Compare the pathways and their support before choosing what suits your project.', href: '/deck-creator-studio/pricing/', label: 'Compare pathways' },
  { title: 'Join Explore or sign in', body: 'Create an account or return with your existing account, then open your Studio workspace.', href: '/auth/register/?mode=join&redirectTo=%2Fstudio%2F', label: 'Join Explore' },
  { title: 'Begin or reopen a project', body: 'Name your project and return to it from My projects whenever you are ready.', href: '/studio/?orientation=skip', label: 'Open My projects' },
  { title: 'Develop your creative direction', body: 'Use the journey map and project tools to explore the purpose, audience and direction of your deck.', href: '/studio/?orientation=skip&task=direction', label: 'Open creative direction' },
  { title: 'Create and revise your cards', body: 'Add a card, work on its writing and return to revise it as your ideas develop.', href: '/studio/?orientation=skip&task=cards', label: 'Open My cards' },
  { title: 'Shape the visual world', body: 'Develop your visual direction, choose a supported physical card size and decide whether to supply complete artwork or use Studio-managed elements. Working previews preserve your original artwork.', href: '/studio/?orientation=skip&task=visual', label: 'Open visual direction' },
  { title: 'Design your guidebook', body: 'Bring your card writing into a coherent guidebook and explore its structure.', href: '/studio/?orientation=skip&task=outline', label: 'Open guidebook design' },
  { title: 'Review the whole project', body: 'Use your Project Workbook to revisit the concept, manuscript and planning material you have saved.', href: '/studio/?orientation=skip&task=workbook', label: 'Open the Project Workbook' },
  { title: 'Keep a private journal', body: 'Record your observations and decisions as your work develops, and return to them when you need them.', href: '/studio/?orientation=skip&task=journal', label: 'Open your journal' },
  { title: 'Prepare for production', body: 'Bring your production choices together. Check artwork instructions, permissions and printer proofs; a working preview is not a certified print-ready file.', href: '/studio/?orientation=skip&task=production', label: 'Open production planning' },
  { title: 'Save, return and export', body: 'Save your changes, review your Project Workbook and use the export options available for your work and membership. Keep full-resolution artwork separately from working previews.', href: '/studio/?orientation=skip&task=exports', label: 'Open project exports' }
];
