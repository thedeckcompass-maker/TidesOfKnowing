import type {PrivatePgConnection} from './postgresServiceRepository';
export type PgClient={connect():Promise<unknown>;query(sql:string,values?:any[]):Promise<{rows:any[]}>;end():Promise<void>};
export type PgFactory=(connectionString:string)=>PgClient;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Request-scoped pg driver. Hyperdrive binding and restricted DB login are explicitly provisioned separately. */
export function cloudflareServiceConnection(binding:{connectionString:string}|undefined,actor:string,factory:PgFactory):PrivatePgConnection{
 if(!binding?.connectionString||!uuid.test(actor))throw Error('Verified account and database binding required.');
 return {async transaction(work){const c=factory(binding.connectionString);let begun=false;try{await c.connect();await c.query('BEGIN ISOLATION LEVEL SERIALIZABLE');begun=true;await c.query('SET LOCAL ROLE dcs_service_executor');await c.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('statement_timeout','15000',true),set_config('lock_timeout','5000',true)",[actor]);const result=await work((sql,values)=>c.query(sql,values));await c.query('COMMIT');begun=false;return result;}catch{if(begun)try{await c.query('ROLLBACK')}catch{}throw Error('Service transaction was not confirmed. Keep the same retry key and reload before retrying.');}finally{try{await c.end()}catch{}}}};
}
