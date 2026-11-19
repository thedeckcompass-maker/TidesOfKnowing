import type {SupabaseClient} from '@supabase/supabase-js';
import {preparedProjectSnapshotProvider,type ExchangeSnapshotProvider} from './projectSnapshot';
export type ExportActivation={enabled?:boolean;exchangeProvider?:ExchangeSnapshotProvider};
/** Server-only, explicitly configured sources. Never infer an empty Exchange archive. */
export function composeProjectExport(client:SupabaseClient|undefined,config:ExportActivation={}){
 const off={studioProjectSnapshotProvider:null,studioExchangeSnapshotProvider:null};
 if(config.enabled!==true||!client||typeof config.exchangeProvider?.capture!=='function')return off;
 return {studioProjectSnapshotProvider:preparedProjectSnapshotProvider(client),studioExchangeSnapshotProvider:config.exchangeProvider};
}
