import {localSupport} from './contextualSupport';
/** Server composition only. No environment/body switch, credentials or implicit fallback. */
export function supportStore(locals:any){const local=localSupport(locals);if(local)return local;return locals.studioSupportHostedEnabled===true?locals.studioSupportProvider??null:null;}
