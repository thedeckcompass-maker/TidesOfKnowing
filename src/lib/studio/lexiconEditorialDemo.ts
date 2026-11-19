import fixture from '../../../scripts/fixtures/lexicon-editorial-demo-20261117.json';
import {OFFER_VERSION,standardPromise} from './serviceOffers';
import {createServiceRecordStore} from './serviceRecords';

const origin='https://tidesofknowing-dcs-lexicon-preview.tidesofknowing.workers.dev';
const database='https://utzcmbidotxgmulguzxo.supabase.co';
export const LEXICON_EDITORIAL_DEMO_FLAG='lexicon-develop-activity-v1';

/** Existing ledger shape and balance engine, with no commercial ledger writes. */
export function lexiconEditorialFixture(now=Date.now()){
 if(fixture.kind!==LEXICON_EDITORIAL_DEMO_FLAG||fixture.offerVersion!==OFFER_VERSION)throw Error('Demonstration contract requires review.');
 const clock=()=>new Date(now),editor='DEMO-NOT-A-STAFF-IDENTITY';
 const seed=createServiceRecordStore(editor,[{id:fixture.enrolmentId,person:{id:fixture.ownerId,name:'Lexicon demonstration creator'},programme:'develop',start:fixture.programmeStart}],clock).snapshot();
 seed.entries[0].promise=standardPromise('develop',fixture.programmeStart);
 seed.entries[0].consultations=structuredClone(fixture.consultations);
 seed.groups=fixture.groups.map(g=>({id:g.id,title:g.title,at:g.at,invitations:[{enrolmentId:fixture.enrolmentId,rsvp:g.rsvp,attended:g.attended}]}));
 const data=createServiceRecordStore(editor,[],clock,seed).read(fixture.ownerId,false);
 return {...data,demonstration:{kind:fixture.kind,projectId:fixture.projectId,accessEndsAt:fixture.accessEndsAt,readOnly:true,milestones:structuredClone(fixture.milestones)}};
}

/** Opt-in server-only page composition. Never called by admin/reporting routes
 * or the service mutation endpoint. A static fixture cannot create entitlements. */
export async function prepareLexiconEditorialDemo(locals:any,requestOrigin:string,now=Date.now()){
 const env=locals.serverRuntime?.env??{};
 if(env.STUDIO_LEXICON_EDITORIAL_DEMO!==LEXICON_EDITORIAL_DEMO_FLAG)return null;
 if(env.STUDIO_DEPLOYMENT_TARGET!=='lexicon-preview'||env.PUBLIC_SUPABASE_URL!==database||requestOrigin!==origin||locals.studioServiceRecords)return null;
 const client=locals.supabase;
 if(!client||locals.user?.id!==fixture.ownerId||locals.profile?.id!==fixture.ownerId||locals.profile.status!=='active'||locals.profile.role!=='member'||now>=Date.parse(fixture.accessEndsAt))return null;
 const auth=await client.auth.getUser();
 if(auth.error||auth.data?.user?.id!==fixture.ownerId)return null;
 const project=await client.from('studio_projects').select('id,owner_id').eq('id',fixture.projectId).eq('owner_id',fixture.ownerId).maybeSingle();
 if(project.error||project.data?.id!==fixture.projectId||project.data.owner_id!==fixture.ownerId)return null;
 const access=await client.rpc('studio_project_can_edit_v1',{p_project:fixture.projectId});
 if(access.error||access.data!==true)return null;
 const deny=()=>{throw Error('Read-only demonstration: no booking, invitation, payment or service record was created.');};
 return {
  marker:{kind:fixture.kind,readOnly:true,projectId:fixture.projectId,accessEndsAt:fixture.accessEndsAt},
  provider:{demonstration:true,async read(who:string,admin=false){if(who!==fixture.ownerId||admin||Date.now()>=Date.parse(fixture.accessEndsAt))throw Error('Demonstration owner access required.');return lexiconEditorialFixture(now);},act:deny,quotationRead:deny,quotationAct:deny}
 };
}
