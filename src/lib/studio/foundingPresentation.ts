import type {FoundingAgreementResult} from './foundingAgreement';
/** Presentation only. Never authorizes a read, write or grant. Receipt must belong to the viewer. */
export function foundingPresentation(input: {viewerId:string; receipt?:FoundingAgreementResult|null; intro?:boolean; revoked?:boolean; supportAvailable?:boolean; effectiveWrite?:boolean; effectiveRead?:boolean; now?:number}) {
 const now=input.now??Date.now(),r=input.receipt;
 if(input.revoked)return {state:'unavailable',heading:"We couldn't confirm your access",copy:'Please check your current access before continuing.'};
 if(!r)return input.intro?{state:'intro',heading:'Getting started',copy:'Explore the Studio and your project direction. Your first two sessions carry no obligation to continue.'}:{state:'unavailable',heading:"We couldn't confirm your access",copy:'Please try again. No access state has been assumed.'};
 const start=Date.parse(r.collaborationStarts),support=Date.parse(r.supportEnds),end=Date.parse(r.platformEnds);
 if(r.userId!==input.viewerId||![start,support,end].every(Number.isFinite)||!(start<support&&support<end))return {state:'unavailable',heading:"We couldn't confirm your access",copy:'Please try again. No access state has been assumed.'};
 if(now<start)return {state:'scheduled',heading:'Awaiting commencement',copy:'Your founding collaboration starts on the agreed date shown below. Existing access remains governed by your current entitlement.'};
 if(now<support)return input.supportAvailable===false?{state:'support-unavailable',heading:'Check your personal support access',copy:'Your saved collaboration dates do not currently establish permission to submit. Please check your support access with Leilia.'}:{state:'active',heading:'Founding collaboration active',copy:'Continue developing your deck or select writing for editorial input.'};
 if(now<end)return {state:'support-ended',heading:'Your Studio access continues',copy:'Your personal support period has ended. Eligible requests submitted before it ended will still receive their response. New requests and additional review rounds are not included.'};
 if(input.effectiveWrite)return {state:'renewed',heading:'Current access',copy:'Your other valid entitlement continues to govern your Studio access.'};
 if(input.effectiveRead&&now<end+28*86400000)return {state:'grace',heading:'Read and download access',copy:'Your founding platform access period has concluded. The 28-day read and download period does not extend editing rights.'};
 return {state:'ended',heading:'Access period ended',copy:'Use only the account and access options currently available to you. Your work has not been deleted by this status change.'};
}

/** Timeout is not failure evidence. Reconcile a matching authoritative receipt before any retry. */
export async function reconcileFoundingConfirmation<T>(submit:()=>Promise<T>,readReceipt:()=>Promise<T|null>):Promise<{state:'confirmed';result:T}|{state:'uncertain'}>{
 try{return {state:'confirmed',result:await submit()};}catch{try{const result=await readReceipt();if(result)return {state:'confirmed',result};}catch{}return {state:'uncertain'};}
}
