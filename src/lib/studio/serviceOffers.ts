/** Versioned commercial promises. Prices are USD; unknown limits/durations are deliberately absent. */
export const LEGACY_OFFER_VERSION='2026-10-24-standard-v1';
export const OFFER_VERSION='2026-10-31-standard-v2';
// New Develop purchases only. Recorded v1/v2 promises are never rewritten.
export const INITIAL_UNLOCK_DEVELOP_VERSION='2026-11-17-develop-initial-unlock-v1';
export function newPurchaseOfferVersion(offer:string){return offer==='develop'?INITIAL_UNLOCK_DEVELOP_VERSION:OFFER_VERSION;}
export function supportedPaymentPromise(version:string,offer:string){return version===OFFER_VERSION||(version===INITIAL_UNLOCK_DEVELOP_VERSION&&offer==='develop');}
export const STANDARD_OFFERS={
 explore:{name:'Explore',description:'Start your deck concept and join the chapter community.',monthly:0,annual:null,programmeMonths:null,createMonths:null,groups:0,consultations:0,assessments:0},
 create:{name:'Create',description:'Develop your cards, artwork and guidebook, then prepare and export your work independently.',monthly:12,annual:120,programmeMonths:null,createMonths:null,groups:0,consultations:0,assessments:0},
 collaborate:{name:'Collaborate',description:'Develop your deck with group editorial guidance, a private consultation and a focused written review.',price:590,instalment:310,payments:2,total:620,programmeMonths:6,createMonths:12,groups:6,consultations:1,assessments:1},
 develop:{name:'Develop',description:'Work more closely with Leilia on your concept, structure and writing through consultations and written reviews.',price:1490,instalment:525,payments:3,total:1575,programmeMonths:6,createMonths:12,groups:8,consultations:4,assessments:2}
} as const;
// Preserve recorded legacy purchases; never reprice an existing promise.
export const LEGACY_OFFERS={...STANDARD_OFFERS,collaborate:{...STANDARD_OFFERS.collaborate,groups:8,instalment:210,payments:3,total:630}} as const;
export function offersForVersion(version:string){if(version===OFFER_VERSION||version===INITIAL_UNLOCK_DEVELOP_VERSION)return STANDARD_OFFERS;if(version===LEGACY_OFFER_VERSION)return LEGACY_OFFERS;throw Error('Unrecognised recorded offer version.');}
export type StandardProgramme='collaborate'|'develop';
export function addCalendarMonths(date:string,months:number){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Enter the confirmed payment/enrolment date.');const d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('Enter a valid enrolment date.');const m=d.getUTCMonth()+months,y=d.getUTCFullYear()+Math.floor(m/12);return new Date(Date.UTC(y,m%12,Math.min(d.getUTCDate(),new Date(Date.UTC(y,m%12+1,0)).getUTCDate()))).toISOString().slice(0,10);}
export function standardPromise(programme:StandardProgramme,start:string){if(!['collaborate','develop'].includes(programme))throw Error('Choose a standard programme.');return {version:OFFER_VERSION,programme,start,editorialEnds:addCalendarMonths(start,6),createEnds:addCalendarMonths(start,12),benefits:structuredClone(STANDARD_OFFERS[programme]),privateMinutes:30,groupMinutes:30,assessmentLimit:null};}
/** Review-only proposed eligibility. Existing hosted gates are not changed by this module. */
export function proposedCommunityEligibility(tier:string,active:boolean){return active&&['explore','create','collaborate','develop','founder'].includes(tier);}
export function proposedConfidentialEligibility(tier:string,inSupport:boolean){return inSupport&&['founder','develop'].includes(tier);}
