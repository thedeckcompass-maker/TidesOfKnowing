import type {FoundingAgreementCommand,FoundingAgreementResult} from './foundingAgreement';
export const FOUNDING_ADMIN='7e3224e7-b303-4150-a45e-dd9a12efdb68';
// Release is disabled by default; only trusted server bindings may enable it.
export const FOUNDING_RELEASE=Object.freeze({enabled:false,origin:''});
export function foundingConfiguration(env:Record<string,unknown>={}){
 return env.STUDIO_FOUNDING_ENABLED==='true'&&env.STUDIO_FOUNDING_ORIGIN==='https://www.tidesofknowing.com'
  ?{enabled:true,origin:'https://www.tidesofknowing.com'}:FOUNDING_RELEASE;
}
type Identity={id:string;role:string;status:string};
type Transport={rpc:(name:string,args:any)=>Promise<{data:any;error:any}>};
type Configuration={enabled:boolean;origin:string};
export function validateFoundingCompletion(command:FoundingAgreementCommand,now=Date.now()){
 const completed=(value:string)=>{
  const match=/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  const invalid=()=>{throw Error('Enter completed-session dates as valid timestamps with Z or an explicit HH:MM offset.');};
  if(!match)return invalid();
  const date=new Date(match[1]+'T00:00:00Z'),offset=match[5];
  if(match[1].startsWith('0000-')||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==match[1]||Number(match[2])>23||Number(match[3])>59||Number(match[4])>59||(offset!=='Z'&&(Number(offset.slice(1,3))>23||Number(offset.slice(4,6))>59)))return invalid();
  const parsed=Date.parse(value);if(!Number.isFinite(parsed))return invalid();return parsed;
 };
 const first=completed(command.onboardingCompleted),second=completed(command.setupCompleted);
 if(!Number.isFinite(now)||first>second||second>now)throw Error('Record completed onboarding followed by completed personal setup; neither may be in the future.');
}
export function createFoundingRuntime(db:Transport|undefined,actor:Identity|null,url:URL,config:Configuration=FOUNDING_RELEASE){
 if(!config.enabled||!db||!actor||actor.status!=='active'||url.origin!==config.origin||!(actor.id===FOUNDING_ADMIN&&actor.role==='admin'||actor.role==='member'))return null;
 const targetAllowed=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)&&id!==FOUNDING_ADMIN&&(id===actor.id||actor.id===FOUNDING_ADMIN&&actor.role==='admin');
 const result=(value:any,id:string):value is FoundingAgreementResult=>value?.userId===id&&['collaborationStarts','supportEnds','platformEnds','accessExpires'].every(k=>typeof value[k]==='string'&&Number.isFinite(Date.parse(value[k])));
 const read=async(id:string,command?:FoundingAgreementCommand)=>{
  if(!targetAllowed(id))throw Error('This founding account is unavailable.');
  if(command&&(actor.id!==FOUNDING_ADMIN||command.userId!==id))throw Error('Only Leilia may reconcile commencement.');
  const {data,error}=await db.rpc('studio_founding_status_v1',{p:{userId:id,...(command?{command}:{})}});
  if(error||data?.userId!==id)throw Error('We could not confirm the saved access status.');
  if(data.receipt&&!result(data.receipt,id))throw Error('We could not confirm the saved commencement dates.');
  if(data.confirmation&&!result(data.confirmation,id))throw Error('We could not confirm that operation.');
  return data;
 };
 return {read,canConfirm:actor.id===FOUNDING_ADMIN&&actor.role==='admin',async confirm(command:FoundingAgreementCommand){
  if(actor.id!==FOUNDING_ADMIN||actor.role!=='admin'||!targetAllowed(command.userId))throw Error('Only Leilia may confirm commencement for the selected member.');
  if(!/^[A-Za-z0-9_-]{1,90}$/.test(command.key)||!command.agreementConfirmed||!command.paymentVerified)throw Error('Confirm the agreement and independently verified payment.');
  // Every attempt reconciles first, including a browser refresh of a previous POST.
  try{const saved=await read(command.userId,command);if(saved.confirmation)return {state:'confirmed' as const,result:saved.confirmation as FoundingAgreementResult};}catch{return {state:'uncertain' as const};}
  validateFoundingCompletion(command);
  try{const {data,error}=await db.rpc('studio_confirm_founding_agreement_v1',{p:command});if(error||!result(data,command.userId))throw Error('Unverified response');return {state:'confirmed' as const,result:data};}
  catch{try{const saved=await read(command.userId,command);if(saved.confirmation)return {state:'confirmed' as const,result:saved.confirmation as FoundingAgreementResult};}catch{}return {state:'uncertain' as const};}
 }};
}
export function foundingRuntime(locals:any,url:URL){
 const user=locals.user,profile=locals.profile;
 return createFoundingRuntime(locals.supabase,user&&profile?.id===user.id?{id:user.id,role:profile.role,status:profile.status}:null,url,foundingConfiguration(locals.serverRuntime?.env));
}
export function foundingCommand(form:FormData):FoundingAgreementCommand{
 const field=(key:string)=>String(form.get(key)||'');
 return {userId:field('userId'),key:field('key'),expectedAccessVersion:field('version'),onboardingCompleted:field('onboardingCompleted'),setupCompleted:field('setupCompleted'),collaborationStarts:field('collaborationStarts'),agreementConfirmed:form.get('agreementConfirmed')==='on',paymentVerified:form.get('paymentVerified')==='on'};
}
