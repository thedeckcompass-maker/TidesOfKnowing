import {ASK_LEILIA_READINGS,ASK_LEILIA_PUBLIC_TRUST_POINTS} from './askLeilia';
// Compatible eight-question B: FAQ, reconciled to the current application offer data.
// No new payment, delivery, confidentiality or AI-training promise is introduced.
export const tidesFaqSections=[
 {id:'readings',title:'Readings and guidance',questions:[
  ['What does Tides of Knowing offer?','Tides of Knowing offers personal Ask Leilia readings, practical resources for symbolic interpretation and The COMPASS Method™. Deck Creator Studio provides a separate workspace for developing a deck of cards and writing.'],
  ['What happens in an Ask Leilia reading?','Leilia considers your question and context, chooses the spread or spreads that fit, and interprets the cards personally. The reading is tailored to the situation you bring rather than a rigid card-count template.'],
  ['Which reading should I choose, and what does it cost?',ASK_LEILIA_READINGS.map(r=>`${r.name}: ${r.price}. ${r.positioning}`).join(' ')],
  ['Can I ask about cards I have already drawn?','The One Question request lets you choose to upload a photograph of your own cards. Provide a clear photograph when selecting that option; otherwise Leilia can draw the cards for your question.']
 ]},
 {id:'requests',title:'Requests and delivery',questions:[
  ['How do I request and pay for a reading?','Choose a reading and open its request form. The form explains the information needed and its available next steps. Follow the payment and confirmation instructions shown there; viewing this FAQ does not create a booking or confirm a payment.'],
  ['What information do I need to provide?','Provide your name, reply email and the question or context relevant to your reading. Personal Guidance lets you identify areas of life you would like considered without requiring a single specific question. Share useful background rather than every detail of your history.'],
  ['What will I receive, and when?',`You receive a personally interpreted written PDF with photographs of the spread or spreads used. Personal Guidance includes photographs of the Waka Spread. ${ASK_LEILIA_PUBLIC_TRUST_POINTS.find(s=>s.startsWith('Delivered within'))??'Check the selected reading’s current delivery information.'}`]
 ]},
 {id:'privacy',title:'Personal information',questions:[
  ['How is my personal information handled?','The request form collects your contact details and the information needed to understand your reading. Share only the context relevant to that purpose. Read the Privacy Policy for information about personal data and privacy requests.']
 ]}
];
