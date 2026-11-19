import {CREATIVE_CHAPTERS} from './creatorJourney';
export {CREATIVE_CHAPTERS};
export function assertCommunityQuestionMinimum(text:string){
  if(Array.from(text.trim()).length<20)throw Error('Please write at least 20 characters about your question before sharing. Your draft has not been shortened or sent.');
}
export function communityQuestion(text:string,requestResponse:boolean){
  assertCommunityQuestionMinimum(text);
  // An existing intentional mention is retained, not duplicated or silently removed.
  const question=requestResponse&&!/(^|[^\w@])@leilia\b/i.test(text)?text+'\n\n@leilia':text;
  if(question.length>6000)throw Error('Leave room for @leilia within the 6,000-character question limit. Your draft has not been shortened.');
  return question;
}
export function isCommunityChapter(value:string){return CREATIVE_CHAPTERS.some(c=>c.id===value);}
