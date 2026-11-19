// Recovered Stage6C profile model. Hosted activation deliberately unavailable.
export function localArtistStore(locals:any){return locals.studioArtistLocal===true?locals.studioArtistStore??null:null}
/** Conversation persistence requires its own reviewed contract and explicit trusted flag. Never infer it from directory access. */
export function artistConversationStore(locals:any){const store=locals.studioArtistLocal===true?localArtistStore(locals):(locals.studioArtistConversationsEnabled===true?locals.studioArtistConversationProvider:null);return store&&['canCreator','conversations','shortlist','requestIntroduction','respondIntroduction'].every(key=>typeof store[key]==='function')?store:null;}
export const artistUnavailable=()=>new Response(JSON.stringify({error:'Artist profiles and private uploads are not connected in this environment. No application was submitted.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'private,no-store'}});

/** Only Exchange routes opt into this separately composed server provider. */
export function exchangeStore(locals:any){return localArtistStore(locals)??(locals.studioExchangeHostedEnabled===true?locals.studioExchangeProvider??null:null);}
