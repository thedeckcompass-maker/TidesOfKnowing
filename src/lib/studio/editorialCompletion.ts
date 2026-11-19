/** Reference predicate for the unexecuted guarded completion delta. Never used to
 * grant a browser permission. Submission/follow-up eligibility remains unchanged.
 */
export function eligiblePendingCompletion(input: {
  actorId: string; assignedAdminId: string; actorActiveAdmin: boolean;
  ownerActive: boolean; accessRevoked: boolean; allocatedAssessment: boolean;
  request: {status: string; createdAt: string};
  grants: {capability: string; membershipKind: string; revoked: boolean;
    starts: string; ends: string; collaborationStarts: string;
    supportStarts: string; supportEnds: string; platformEnds: string}[];
}): boolean {
  if (!input.actorActiveAdmin || input.actorId !== input.assignedAdminId ||
      !input.ownerActive || input.accessRevoked || input.allocatedAssessment ||
      !['requested', 'in_review'].includes(input.request.status)) return false;
  const submitted = Date.parse(input.request.createdAt);
  if (!Number.isFinite(submitted)) return false;
  const contains = (start: string, end: string) => {
    const a = Date.parse(start), b = Date.parse(end);
    return Number.isFinite(a) && Number.isFinite(b) && a <= submitted && submitted < b;
  };
  return input.grants.some(g => g.capability === 'editorial' &&
    ['collaboration', 'highest-private'].includes(g.membershipKind) && !g.revoked &&
    contains(g.starts, g.ends) && contains(g.collaborationStarts, g.platformEnds) &&
    contains(g.supportStarts, g.supportEnds));
}
