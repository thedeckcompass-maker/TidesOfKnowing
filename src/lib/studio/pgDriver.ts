import pg from 'pg';
import type {PgFactory} from './cloudflareServiceConnection';
/** Cloudflare nodejs_compat + reviewed Hyperdrive binding; no connection at module load. */
export const pgDriver:PgFactory=(connectionString)=>new pg.Client({connectionString,connectionTimeoutMillis:10000,query_timeout:15000});
