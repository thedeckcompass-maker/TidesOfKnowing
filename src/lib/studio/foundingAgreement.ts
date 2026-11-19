import { annualCollaborationPreview, type StudioAccess } from './access';

/** Explicit admin command, separate from standard paid programme fulfilment.
 * No runtime composition installs this candidate. It creates no checkout or service allocation.
 * A future repository must transact access, capabilities, audit and receipt atomically.
 */
export type FoundingAgreementCommand = {
  userId: string; key: string; expectedAccessVersion: string;
  onboardingCompleted: string; setupCompleted: string;
  collaborationStarts: string; agreementConfirmed: boolean; paymentVerified: boolean;
};
export type FoundingCapability = {
  user_id: string; capability: 'editorial' | 'private_community';
  membership_kind: 'collaboration'; starts_at: string; expires_at: string;
  collaboration_starts_at: string; setup_starts_at: string;
  platform_ends_at: string; support_ends_at: string; revoked_at: null;
};
export type FoundingAgreementResult = {
  userId: string; collaborationStarts: string; supportEnds: string;
  platformEnds: string; accessExpires: string; unchanged: boolean;
};
export interface FoundingTransaction {
  profile(id: string): Promise<{id: string; role: string; status: string} | null>;
  accessForUpdate(id: string): Promise<StudioAccess | null>;
  capabilitiesForUpdate(id: string): Promise<{capability: string}[]>;
  receipt(actor: string, key: string): Promise<{payload: string; result: FoundingAgreementResult} | null>;
  /** Resolve calendar boundaries using the existing access record's IANA timezone. */
  boundary(date: string, zone: string): Promise<string>;
  saveAccess(access: StudioAccess, expectedVersion: string): Promise<void>;
  insertCapabilities(rows: FoundingCapability[]): Promise<void>;
  audit(actor: string, command: FoundingAgreementCommand, result: FoundingAgreementResult): Promise<void>;
  putReceipt(actor: string, key: string, payload: string, result: FoundingAgreementResult): Promise<void>;
}
export interface FoundingRepository {
  /** SERIALIZABLE, or equivalent locking; rollback every write on any error. */
  transaction<T>(work: (tx: FoundingTransaction) => Promise<T>): Promise<T>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timestamp = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)))
    throw Error('A verified date and timezone are required.');
  return Date.parse(value);
};

export function prepareFoundingAgreement(config: {
  repository: FoundingRepository; actorId: string; commencementAdminId?: string; enabled?: boolean; now?: () => Date;
}) {
  return async (command: FoundingAgreementCommand): Promise<FoundingAgreementResult> => {
    // Deliberately off unless explicitly composed; no environment-variable or form override.
    if (config.enabled !== true) throw Error('Founding agreement activation is disabled.');
    if (!config.commencementAdminId || config.actorId !== config.commencementAdminId) throw Error('Only the configured founding administrator may confirm commencement.');
    if (!uuid.test(command.userId) || command.userId === config.actorId ||
        !/^[A-Za-z0-9_-]{1,90}$/.test(command.key)) throw Error('Choose a member and a valid retry key.');
    const payload = JSON.stringify({userId: command.userId, expectedAccessVersion: command.expectedAccessVersion,
      onboardingCompleted: command.onboardingCompleted, setupCompleted: command.setupCompleted,
      collaborationStarts: command.collaborationStarts, agreementConfirmed: command.agreementConfirmed,
      paymentVerified: command.paymentVerified});
    return config.repository.transaction(async tx => {
      const actor = await tx.profile(config.actorId), member = await tx.profile(command.userId);
      if (actor?.id !== config.actorId || actor.status !== 'active' || actor.role !== 'admin')
        throw Error('An active administrator is required.');
      if (member?.id !== command.userId || member.status !== 'active' || member.role !== 'member')
        throw Error('An active ordinary member is required.');
      const prior = await tx.receipt(config.actorId, command.key);
      if (prior) {
        if (prior.payload !== payload) throw Error('This retry key belongs to different agreement details.');
        return {...prior.result, unchanged: true};
      }
      const access = await tx.accessForUpdate(command.userId);
      if (!access || access.revoked_at || timestamp(access.updated_at) !== timestamp(command.expectedAccessVersion))
        throw Error('Access changed or is revoked. Reload before confirming the agreement.');
      if (access.phase !== 'intro') throw Error('Existing ongoing access needs an explicit reconciliation.');
      if (!command.agreementConfirmed || !command.paymentVerified)
        throw Error('Confirm the decision to proceed and independently verified payment after both introductions.');
      const now = (config.now ?? (() => new Date()))().getTime();
      const first = timestamp(command.onboardingCompleted), second = timestamp(command.setupCompleted);
      if (first > second || second > now) throw Error('Record completed onboarding followed by completed personal setup.');
      const dates = annualCollaborationPreview('founder', command.collaborationStarts);
      const start = await tx.boundary(dates.collaborationStarts, access.time_zone);
      const supportEnd = await tx.boundary(dates.supportEnds, access.time_zone);
      const platformEnd = await tx.boundary(dates.platformEnds, access.time_zone);
      if (timestamp(supportEnd) <= timestamp(start) ||
          timestamp(platformEnd) <= timestamp(supportEnd)) throw Error('Check the agreed collaboration boundaries.');
      if (timestamp(start)>now && timestamp(access.expires_at)<timestamp(start)) throw Error('Introductory access ends before the agreed future start. Confirm on that date or explicitly reconcile admission; no early access was granted.');
      if (timestamp(platformEnd) <= now) throw Error('The agreed platform period has already ended.');
      const grants = await tx.capabilitiesForUpdate(command.userId);
      if (grants.some(g => g.capability === 'editorial' || g.capability === 'private_community'))
        throw Error('Existing support grants need explicit reconciliation; none were replaced.');
      const expires = timestamp(access.expires_at) > timestamp(platformEnd) ? access.expires_at : platformEnd;
      const result: FoundingAgreementResult = {userId: command.userId, collaborationStarts: start,
        supportEnds: supportEnd, platformEnds: platformEnd, accessExpires: expires, unchanged: false};
      // Preserve original onboarding, access start, timezone and any longer platform entitlement.
      await tx.saveAccess({...access, phase: 'paid', expires_at: expires}, command.expectedAccessVersion);
      await tx.insertCapabilities((['editorial', 'private_community'] as const).map(capability => ({
        user_id: command.userId, capability, membership_kind: 'collaboration', starts_at: start,
        expires_at: supportEnd, collaboration_starts_at: start, setup_starts_at: start,
        platform_ends_at: platformEnd, support_ends_at: supportEnd, revoked_at: null,
      })));
      await tx.audit(config.actorId, command, result);
      await tx.putReceipt(config.actorId, command.key, payload, result);
      return result;
    });
  };
}
