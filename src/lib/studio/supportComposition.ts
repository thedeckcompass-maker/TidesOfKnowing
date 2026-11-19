import type {SupabaseClient} from '@supabase/supabase-js';
import {prepareHostedSupportProvider} from './hostedSupportProvider';
import {preparedSupportEligibility} from './supportEligibility';
export type SupportActivation={enabled?:boolean;recipientId?:string;historyPolicy?:'deny'|'allow'};
/** Trusted server configuration only. No environment discovery, credentials or client-controlled activation. */
export function composeHostedSupport(client:SupabaseClient,config:SupportActivation={}){
 const off={studioSupportHostedEnabled:false as const,studioSupportProvider:null};
 if(config.enabled!==true)return off;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config.recipientId??'')||!['deny','allow'].includes(config.historyPolicy??''))return off;
 return {studioSupportHostedEnabled:true as const,studioSupportProvider:prepareHostedSupportProvider(client,{enabled:true,recipientId:config.recipientId,historyPolicy:config.historyPolicy,eligible:preparedSupportEligibility(client)})};
}
