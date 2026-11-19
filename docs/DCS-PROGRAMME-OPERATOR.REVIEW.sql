-- REVIEW ONLY. Single owner-authorised operator transaction; never executed by generator.
-- Approved Supabase project vbdqvjvhjleqdadiiqjx via authenticated official integration.
-- Acts as database operator; does NOT set JWT claims or impersonate application staff.
BEGIN ISOLATION LEVEL SERIALIZABLE;
DO $bounded_operator$
DECLARE old_body jsonb; additions jsonb := $entries$[{"id":"dcs-permanent-test-collaborate-20261110","ownerId":"c2c5cd1b-95c0-480c-9424-66b3f5974d91","name":"TEST collaborate","promise":{"version":"2026-10-31-standard-v2","programme":"collaborate","start":"2026-11-03","editorialEnds":"2027-05-03","createEnds":"2027-11-03","benefits":{"name":"Collaborate","description":"Develop your deck with group editorial guidance, a private consultation and a focused written assessment.","price":590,"instalment":310,"payments":2,"total":620,"programmeMonths":6,"createMonths":12,"groups":8,"consultations":1,"assessments":1},"privateMinutes":30,"groupMinutes":30,"assessmentLimit":null},"revision":0,"nextGroupRequested":false,"consultations":[],"reviews":[],"fixture":{"kind":"explicit-no-charge-test","approvalReference":"OWNER-APPROVAL-REQUIRED-DCS-FIXTURES-20261110","issuedBy":"7e3224e7-b303-4150-a45e-dd9a12efdb68"}},{"id":"dcs-permanent-test-develop-20261110","ownerId":"c04cc04b-8a55-448a-88e9-3ad48b4a9980","name":"TEST develop","promise":{"version":"2026-10-31-standard-v2","programme":"develop","start":"2026-11-03","editorialEnds":"2027-05-03","createEnds":"2027-11-03","benefits":{"name":"Develop","description":"Work more closely with Leilia on your concept, structure and writing through consultations and written assessments.","price":1490,"instalment":525,"payments":3,"total":1575,"programmeMonths":6,"createMonths":12,"groups":8,"consultations":4,"assessments":2},"privateMinutes":30,"groupMinutes":30,"assessmentLimit":null},"revision":0,"nextGroupRequested":false,"consultations":[],"reviews":[],"fixture":{"kind":"explicit-no-charge-test","approvalReference":"OWNER-APPROVAL-REQUIRED-DCS-FIXTURES-20261110","issuedBy":"7e3224e7-b303-4150-a45e-dd9a12efdb68"}}]$entries$::jsonb; e jsonb; previous record; all_replayed boolean:=true;
BEGIN
 IF session_user<>'postgres' OR current_user<>'postgres' THEN RAISE EXCEPTION 'Reviewed authenticated operator context differs'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='7e3224e7-b303-4150-a45e-dd9a12efdb68' AND status='active' AND role='admin') THEN RAISE EXCEPTION 'Primary staff changed';END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(additions) LOOP
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(e->>'ownerId')::uuid AND status='active' AND role='member') THEN RAISE EXCEPTION 'Target profile changed';END IF;
 END LOOP;
 SELECT body INTO STRICT old_body FROM studio_private.service_ledger_v1 WHERE singleton FOR UPDATE;
 FOR e IN SELECT value FROM jsonb_array_elements(additions) LOOP
 SELECT payload,result INTO previous FROM studio_private.service_receipts_v1 WHERE actor_id='7e3224e7-b303-4150-a45e-dd9a12efdb68' AND key=e->>'id';
 IF NOT FOUND THEN all_replayed:=false;
 ELSIF previous.payload<>'8b6027622d5ad9dec3f923505b8cddbbccb2e082c2d2dd01faa4c92c8df7a3ce' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(old_body->'entries') x WHERE x=e) THEN RAISE EXCEPTION 'Conflicting operator receipt';END IF;
 END LOOP;
 IF all_replayed THEN RETURN;END IF;
 IF md5(old_body::text)<>'8710ba587ecd7fb00730f8505c28bca1' THEN RAISE EXCEPTION 'Ledger drift; stop without repinning';END IF;
 IF jsonb_typeof(old_body->'entries')<>'array' THEN RAISE EXCEPTION 'Invalid existing ledger';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(old_body->'entries') x JOIN jsonb_array_elements(additions) n ON x->>'id'=n->>'id' OR x->>'ownerId'=n->>'ownerId') THEN RAISE EXCEPTION 'Existing target allocation; no replacement';END IF;
 UPDATE studio_private.service_ledger_v1 SET body=jsonb_set(old_body,'{entries}',(old_body->'entries')||additions,false) WHERE singleton;
 FOR e IN SELECT value FROM jsonb_array_elements(additions) LOOP
 INSERT INTO studio_private.service_receipts_v1(actor_id,key,payload,result) VALUES('7e3224e7-b303-4150-a45e-dd9a12efdb68',e->>'id','8b6027622d5ad9dec3f923505b8cddbbccb2e082c2d2dd01faa4c92c8df7a3ce',jsonb_build_object('saved',true,'ownerApprovedOperation',true,'performedByDatabaseRole',session_user,'approvedStaffIdentity','7e3224e7-b303-4150-a45e-dd9a12efdb68','entryId',e->>'id','ownerId',e->>'ownerId','noCharge',true));
 END LOOP;
END; $bounded_operator$;
COMMIT;
-- Separate readback required: exact two entries, receipts, unchanged other fields.
