import {prepareServiceRecordProvider} from './serviceRecordProvider';
import {preparePostgresServiceRepository,type PrivatePgConnection} from './postgresServiceRepository';
export type ServiceActivation={enabled?:boolean;recipientId?:string;connection?:PrivatePgConnection;now?:()=>Date};
/** Trusted server-only configuration. No body/environment activation or fallback. */
export async function composeServiceRecords(locals:any,config:ServiceActivation={}){
 const off={studioServiceRecords:null};
 if(config.enabled!==true||!config.connection||!/^[-a-f0-9]{36}$/i.test(config.recipientId??''))return off;
 const user=await locals.supabase?.auth?.getUser();const actor=user?.data?.user?.id;
 if(user?.error||!actor||actor!==locals.user?.id||locals.profile?.id!==actor||locals.profile?.status!=='active')return off;
 return {studioServiceRecords:prepareServiceRecordProvider({enabled:true,actorId:actor,recipientId:config.recipientId!,repository:preparePostgresServiceRepository(config.connection,actor,config.recipientId!),now:config.now})};
}
