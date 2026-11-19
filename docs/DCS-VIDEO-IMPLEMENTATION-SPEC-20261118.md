# DCS definitive video implementation specification

18 November 2026. This is the D: consolidation of the approved cost-first direction and current local presentation. It does not authorize provider activation, change commercial terms or confer visual/operational acceptance. Further work uses the D: working tree and verified D: snapshot, never direct B: access.

## Existing local presentation

`src/pages/studio/editorial-support.astro` retains the active-user/profile gate and existing service-record presentation. `src/components/studio/VideoSupportGuide.astro` links to existing consultation and group views and presents consultation, group, consent and recording guidance as unavailable or pending. `src/components/studio/SessionTimeDraft.astro` and `src/lib/studio/sessionTimeDraft.ts` provide an in-page preferred-time draft; it does not submit, persist or reserve. Existing records, entitlements and navigation must remain authoritative. No meeting, play, download or consent-saving action is represented as operational.

## Approved cost-first direction and pending implementation

Prefer branded RealtimeKit prebuilt meeting UI, existing Worker and account/service authorization, provider-limited personal recordings, and authenticated private streaming download. Do not add a second conferencing provider or automatic Stream/R2 copies to extend personal recording availability. Optional restricted hosting is conditional on demonstrated need; deliberately public reusable lessons may use suitable public hosting, while unlisted links are not member access control. Recording group participants and publishing identifiable material require separate permission and policy. These are design requirements, not an activated provider or proof of current provider capabilities.

Still required, after separately scoped authority and review:

1. Operational meeting lifecycle and branded host/participant interfaces, device/meeting controls, accurate scheduled/upcoming details and joining, securely bound to the correct existing person, session and service entitlement. Joining must not automatically complete a consultation or record group attendance.
2. Explicit recording consent before capture, scoped to participants, audience and purpose; separately handle sharing and transcript/AI processing consent. Late arrival or withdrawal must stop or pause capture until scope is resolved. Group recording remains off pending owner policy. Consent evidence, privacy notice and withdrawal/retention terms need approval.
3. Provider event authentication and binding to the exact meeting/session/recording; trusted metadata; authorized private recording access and bounded no-store streaming download with verified origin, Range/HEAD and expiry behavior. Do not expose provider bearer URLs, credentials, or private content in messages or logs. Playback is optional until content type, range, CORS and browser behavior are tested. Captions, transcripts and live accessibility require an approved and tested approach; no automatic AI processing is authorized.
4. Verified expiry and failure handling. Seven-day provider-limited personal availability is the approved direction, not a promise of seven days from delivery. The provider retention start event and URL-refresh semantics remain unverified. Hold delivery if expiry is missing, invalid, passed or unbound; cap the client deadline by earlier verified limits and never silently extend it. Distinguish access expiry from proven provider deletion. A failed link or 404 is not proof of erasure; verify deletion/withdrawal capabilities before making a promise.
5. Appropriate verified provider events, durable notification intent and delivery failure visibility, without resetting the deadline. The proposed 24-hour reminder and handling of delayed or lost availability are pending owner decisions, not service guarantees. No invitation/email is authorized by this document.

A saved download can be retained or shared by its recipient; future consent and terms must address that limitation. Private consultations, group recordings and intentionally public educational material are separate categories and must not inherit one another's retention or access policy.

## Unresolved owner and provider decisions

Group recording, audience, access/downloads, consent/withdrawal and retention; classification, restriction, reuse and removal of teaching content; guest identity and privacy/service terms; consent and audit retention; live accessibility processing/budget or effective alternative; reminder and short-window handling. Provider-specific retention start, URL refresh, deletion, streaming and accessibility behavior require independent verification. Do not infer a refund, rerecording, entitlement or long-term archive.

## Reference material and evidence on D:

Verified historical snapshot: `.build-temp/parallel-source-reference-20261113/video-cost-first-20261114T061900Z/`. `governance/OWNER-AUTHORITY.txt`, `CLIENT-RECORDING-POLICY.md`, `CONSENT-PRIVACY-AND-DELETION.md`, `OWNER-DECISIONS.md`, `INTEGRATION-REGISTER.json` and `BRANDING-SPECIFICATION.md` preserve requirements and limits. `client/index.html`, `dcs-private.html`, `group.html`, `consent.html`, `recording.html` and the meeting/recording lifecycle variants are standalone fictional, inert references, not approved operational screens. `docs/DCS-VIDEO-LOCAL-REVIEW-20261118.md` and `docs/DCS-OWNER-VISUAL-REVIEW-20261118.html` contain local/reference captures. Isolated component screenshots use fallback fonts and are not authenticated acceptance.

No provider integration, production or preview database change, recording, token, email or deployment is authorized here. Owner visual and editorial acceptance and all relevant hosted acceptance remain outstanding.