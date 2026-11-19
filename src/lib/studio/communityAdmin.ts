import {supportStore} from './supportProvider';
import {isAdminProfile} from '../community/auth';
/** Local integration only; no hosted/service-role fallback or new role grants. */
export async function communityAdminStore(locals:any){
 if(!locals.user||locals.profile?.id!==locals.user.id||!isAdminProfile(locals.profile))throw Error('This queue is not available.');
 const store=supportStore(locals);
 if(!store)throw Error('Hosted DCS community questions are not connected. Nothing has been sent.');
 if(!await store.isStaff(locals.user.id,true))throw Error('This queue is not available.');
 return store;
}
