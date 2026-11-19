import type {PrivatePgConnection} from './postgresServiceRepository';
import type {FoundingRepository, FoundingTransaction} from './foundingAgreement';

/** UNACTIVATED adapter. Existing executor does NOT have the required access/capability
 * writes. Do not grant them to make this run: hosted activation requires a separately
 * reviewed guarded administrative RPC. This adapter is for isolated local validation.
 * Uses existing record shapes and service receipts, not a new identity/service store.
 */
export function prepareLocalPostgresFoundingRepository(connection: PrivatePgConnection,
  actorId: string, memberId: string): FoundingRepository {
  return {transaction: work => connection.transaction(async query => {
    const identity = await query("SELECT current_setting('request.jwt.claim.sub',true) AS actor");
    if (identity.rows[0]?.actor !== actorId) throw Error('Database actor does not match the verified administrator.');
    // Serialize this member even when support rows do not yet exist.
    await query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['founding:' + memberId]);
    const profiles = (await query('SELECT * FROM studio_private.service_actor_profiles_v1($1::uuid)', [memberId])).rows;
    let audit: unknown;
    const target = (id: string) => {if (id !== memberId) throw Error('Unexpected agreement member.');};
    const tx: FoundingTransaction = {
      async profile(id) {return profiles.find(p => p.id === id) ?? null;},
      async accessForUpdate(id) {target(id); const rows = (await query(
        'SELECT user_id,phase,onboarding_date,time_zone,starts_at,expires_at,revoked_at,updated_at FROM public.studio_access WHERE user_id=$1::uuid FOR UPDATE', [id])).rows;
        if (rows.length !== 1) return null;
        const row = {...rows[0]};
        for (const key of ['starts_at','expires_at','revoked_at','updated_at']) if (row[key] instanceof Date) row[key] = row[key].toISOString();
        return row;
      },
      async capabilitiesForUpdate(id) {target(id); return (await query(
        'SELECT capability FROM public.studio_capability_grants WHERE user_id=$1::uuid FOR UPDATE', [id])).rows;},
      async receipt(actor, key) {if (actor !== actorId) throw Error('Unexpected receipt actor.');
        return (await query('SELECT payload,result FROM studio_private.service_receipts_v1 WHERE actor_id=$1::uuid AND key=$2', [actor, 'founding:' + key])).rows[0] ?? null;},
      async boundary(date, zone) {const value = (await query(
        'SELECT ($1::date::timestamp AT TIME ZONE $2) AS boundary', [date, zone])).rows[0]?.boundary;
        return value instanceof Date ? value.toISOString() : value;
      },
      async saveAccess(access, expectedVersion) {target(access.user_id);
        const result = await query('UPDATE public.studio_access SET phase=$2,expires_at=$3::timestamptz,updated_at=clock_timestamp(),updated_by=$5::uuid WHERE user_id=$1::uuid AND updated_at=$4::timestamptz AND revoked_at IS NULL RETURNING user_id',
          [access.user_id,access.phase,access.expires_at,expectedVersion,actorId]);
        if (result.rows.length !== 1 || result.rows[0].user_id !== memberId) throw Error('Access update was not confirmed.');
      },
      async insertCapabilities(rows) {for (const row of rows) {target(row.user_id);
        await query('INSERT INTO public.studio_capability_grants(user_id,capability,membership_kind,starts_at,expires_at,collaboration_starts_at,setup_starts_at,platform_ends_at,support_ends_at,revoked_at) VALUES($1::uuid,$2,$3,$4::timestamptz,$5::timestamptz,$6::timestamptz,$7::timestamptz,$8::timestamptz,$9::timestamptz,NULL)',
          [row.user_id,row.capability,row.membership_kind,row.starts_at,row.expires_at,row.collaboration_starts_at,row.setup_starts_at,row.platform_ends_at,row.support_ends_at]);
      }},
      async audit(actor, command, result) {audit = {actor,command,result};},
      async putReceipt(actor,key,payload,result) {if (actor !== actorId || !audit) throw Error('Agreement audit is missing.');
        await query('INSERT INTO studio_private.service_receipts_v1(actor_id,key,payload,result) VALUES($1::uuid,$2,$3,$4::jsonb)',
          [actor,'founding:' + key,payload,JSON.stringify({...result,agreementAudit:audit})]);
      },
    };
    return work(tx);
  })};
}
