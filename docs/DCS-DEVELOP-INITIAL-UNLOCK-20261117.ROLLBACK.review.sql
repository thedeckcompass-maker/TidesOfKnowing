-- REVIEW ONLY. Reverting application code also needs an explicit release decision.
BEGIN;
DO $$ BEGIN IF to_regprocedure('public.studio_apply_verified_billing_v1(jsonb)') IS NULL OR nullif(current_setting('dcs.reviewed_billing_function_md5',true),'') IS NULL OR current_setting('dcs.reviewed_billing_function_md5',true) IS DISTINCT FROM md5(pg_get_functiondef(to_regprocedure('public.studio_apply_verified_billing_v1(jsonb)'))) THEN RAISE EXCEPTION 'Independently review and pin installed billing function before applying'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM studio_private.service_ledger_v1 l CROSS JOIN LATERAL jsonb_array_elements(l.body->'entries') x WHERE x->'promise'->>'version'='2026-11-17-develop-initial-unlock-v1') THEN RAISE EXCEPTION 'New-version purchases exist: preserve promises and review forward compatibility'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.studio_apply_verified_billing_v1(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $billing$
DECLARE owner uuid; mode text; ledger jsonb; slice jsonb; old_access public.studio_access;
 saved_access public.studio_access; next_access jsonb; expected_version timestamptz;
 entries jsonb; intents jsonb; receipts jsonb; baseline jsonb; old_item jsonb; new_item jsonb;
 receipt_key text; prior jsonb; revision text; result jsonb;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Trusted billing caller required' USING ERRCODE='42501'; END IF;
 IF p IS NULL OR jsonb_typeof(p)<>'object' OR octet_length(p::text)>4000000 THEN RAISE EXCEPTION 'Bounded billing command required'; END IF;
 mode:=p->>'operation';
 IF mode='dueOwners' THEN
  IF p->>'after' IS NOT NULL AND (p->>'after') !~ '^[a-f0-9-]{36}$' THEN RAISE EXCEPTION 'Invalid owner cursor'; END IF;
  RETURN jsonb_build_object('owners',coalesce((SELECT jsonb_agg(q.owner_id ORDER BY q.owner_id) FROM (
   SELECT DISTINCT x->>'ownerId' AS owner_id FROM studio_private.service_ledger_v1 l CROSS JOIN LATERAL jsonb_array_elements(l.body->'entries') x
   JOIN public.profiles profile ON profile.id::text=x->>'ownerId' AND profile.status='active' AND profile.role='member'
   WHERE l.singleton=true AND x->'payment'->>'terminatedAt' IS NULL AND coalesce(x->'payment'->'refund'->>'kind','')<>'full' AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(x->'payment'->'failures','[]'::jsonb)) f WHERE (f->>'failedAt')::timestamptz<=now()-interval '21 days') AND x->>'ownerId'>coalesce(p->>'after','') ORDER BY owner_id LIMIT 100
  ) q),'[]'::jsonb));
 END IF;
 owner:=(p->>'ownerId')::uuid;
 IF owner IS NULL OR (mode IS NULL OR mode NOT IN ('inspect','commit')) THEN RAISE EXCEPTION 'Owner and supported operation required'; END IF;
 SELECT body INTO ledger FROM studio_private.service_ledger_v1 WHERE singleton=true FOR UPDATE;
 IF ledger IS NULL OR jsonb_typeof(ledger->'entries')<>'array' OR jsonb_typeof(ledger->'enrolmentIntents')<>'array' THEN RAISE EXCEPTION 'Existing billing ledger unavailable'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=owner AND role='member' AND status='active' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active ordinary member required' USING ERRCODE='42501'; END IF;
 SELECT * INTO old_access FROM public.studio_access WHERE user_id=owner FOR UPDATE;
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO entries FROM jsonb_array_elements(ledger->'entries') x WHERE x->>'ownerId'=owner::text;
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO intents FROM jsonb_array_elements(ledger->'enrolmentIntents') x WHERE x->>'ownerId'=owner::text;
 baseline:=ledger->'billingAccessBaselines'->owner::text;
 receipts:=coalesce(ledger->'billingAccessReceipts'->owner::text,'[]'::jsonb);
 revision:=md5(ledger::text);
 IF mode='inspect' THEN
  RETURN jsonb_build_object('profile',(SELECT to_jsonb(profile_row) FROM public.profiles profile_row WHERE profile_row.id=owner),'groups',coalesce((SELECT jsonb_agg(g) FROM jsonb_array_elements(coalesce(ledger->'groups','[]'::jsonb)) g WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(g->'invitations') v JOIN jsonb_array_elements(entries) e ON e->>'id'=v->>'enrolmentId')),'[]'::jsonb),'ownerId',owner,'entries',entries,'enrolmentIntents',intents,'access',CASE WHEN old_access.user_id IS NULL THEN NULL ELSE to_jsonb(old_access) END,'baseline',baseline,'receipts',receipts,'revision',revision);
 END IF;
 receipt_key:=p->>'receiptKey'; slice:=p->'slice'; result:=p->'result';
 IF receipt_key IS NULL OR length(receipt_key) NOT BETWEEN 1 AND 200 OR p->>'payload' IS NULL OR jsonb_typeof(slice) IS DISTINCT FROM 'object' OR slice->>'ownerId' IS DISTINCT FROM owner::text THEN RAISE EXCEPTION 'Complete owner billing plan required'; END IF;
 SELECT x INTO prior FROM jsonb_array_elements(receipts) x WHERE x->>'key'=receipt_key;
 IF prior IS NOT NULL THEN
  IF prior->>'payload' IS DISTINCT FROM p->>'payload' THEN RAISE EXCEPTION 'Billing receipt conflict'; END IF;
  RETURN jsonb_build_object('result',(prior->'result')||jsonb_build_object('unchanged',true));
 END IF;
 IF p->>'revision' IS DISTINCT FROM revision THEN RAISE EXCEPTION 'Ledger changed; re-read and retry without creating another payment'; END IF;
 IF (old_access.user_id IS NULL) IS DISTINCT FROM (p->>'expectedAccessVersion' IS NULL) OR old_access.updated_at IS DISTINCT FROM (p->>'expectedAccessVersion')::timestamptz THEN RAISE EXCEPTION 'Access changed; preserve administrator changes'; END IF;
 IF old_access.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'Revoked access needs explicit reconciliation'; END IF;
 IF jsonb_typeof(slice->'entries') IS DISTINCT FROM 'array' OR jsonb_typeof(slice->'enrolmentIntents') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Owner arrays required'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements((slice->'entries')||(slice->'enrolmentIntents')) x WHERE x->>'ownerId' IS DISTINCT FROM owner::text) THEN RAISE EXCEPTION 'Foreign owner in billing plan' USING ERRCODE='42501'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(slice->'entries'))<>(SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(slice->'entries') x) OR (SELECT count(*) FROM jsonb_array_elements(slice->'enrolmentIntents'))<>(SELECT count(DISTINCT x->>'purchaseId') FROM jsonb_array_elements(slice->'enrolmentIntents') x) THEN RAISE EXCEPTION 'Duplicate billing identity'; END IF;
 -- Billing cannot delete service history, edit completed work or reprice original programmes.
 FOR old_item IN SELECT x FROM jsonb_array_elements(entries) x LOOP
  SELECT x INTO new_item FROM jsonb_array_elements(slice->'entries') x WHERE x->>'id'=old_item->>'id';
  IF new_item IS NULL OR (new_item-'payment'-'promise') IS DISTINCT FROM (old_item-'payment'-'promise') THEN RAISE EXCEPTION 'Existing service history must be preserved'; END IF;
  IF old_item->'promise'->>'programme'='create' THEN
   IF ((new_item->'promise')-'createEnds') IS DISTINCT FROM ((old_item->'promise')-'createEnds') THEN RAISE EXCEPTION 'Original Create promise must be preserved'; END IF;
  ELSIF new_item->'promise' IS DISTINCT FROM old_item->'promise' THEN RAISE EXCEPTION 'Original programme promise must be preserved'; END IF;
 END LOOP;
 FOR old_item IN SELECT x FROM jsonb_array_elements(intents) x LOOP
  SELECT x INTO new_item FROM jsonb_array_elements(slice->'enrolmentIntents') x WHERE x->>'purchaseId'=old_item->>'purchaseId';
  IF new_item IS NULL OR new_item->>'id' IS DISTINCT FROM old_item->>'id' OR new_item->>'offer' IS DISTINCT FROM old_item->>'offer' OR new_item->>'billing' IS DISTINCT FROM old_item->>'billing' THEN RAISE EXCEPTION 'Original purchase identity must be preserved'; END IF;
  IF old_item->'promise'->>'version'<>'2026-10-31-standard-v2' AND new_item IS DISTINCT FROM old_item THEN
   IF (new_item-'supersededForAccessBy') IS DISTINCT FROM old_item OR old_item->>'offer'<>'create' OR NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(slice->'entries') e JOIN jsonb_array_elements(slice->'enrolmentIntents') i ON i->>'id'=e->>'id'
    WHERE i->>'purchaseId'=new_item->>'supersededForAccessBy' AND e->'payment'->'upgrade'->>'priorSubscriptionId'=old_item->>'subscriptionId'
     AND e->'payment'->'upgrade'->>'renewalsStopped'='true' AND length(e->'payment'->'upgrade'->>'providerAdjustmentId')>0
   ) THEN RAISE EXCEPTION 'Historical purchase requires explicit reconciliation'; END IF;
  END IF;
 END LOOP;
 FOR new_item IN SELECT x FROM jsonb_array_elements(slice->'entries') x WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(entries) y WHERE y->>'id'=x->>'id') LOOP
  IF new_item->'promise'->>'version'<>'2026-10-31-standard-v2' OR new_item->'consultations'<>'[]'::jsonb OR new_item->'reviews'<>'[]'::jsonb THEN RAISE EXCEPTION 'Verified new purchase cannot fabricate delivered services'; END IF;
 END LOOP;
 -- The manual baseline is immutable after its first capture. SQL records the actual saved version.
 IF baseline IS NOT NULL AND slice->'baseline'->'original' IS DISTINCT FROM baseline->'original' THEN RAISE EXCEPTION 'Manual baseline cannot be rewritten'; END IF;
 IF baseline IS NULL AND slice->'baseline'->'original' IS DISTINCT FROM (CASE WHEN old_access.user_id IS NULL THEN 'null'::jsonb ELSE to_jsonb(old_access) END) THEN RAISE EXCEPTION 'Original manual baseline mismatch'; END IF;
 next_access:=slice->'access';
 IF next_access IS NOT NULL AND next_access<>'null'::jsonb THEN
  IF next_access->>'user_id'<>owner::text OR (next_access->>'phase' IS DISTINCT FROM 'paid' AND (old_access.user_id IS NULL OR next_access->>'phase' IS DISTINCT FROM old_access.phase)) OR next_access->>'updated_by' IS NOT NULL OR next_access->>'revoked_at' IS NOT NULL OR (next_access->>'expires_at')::timestamptz<=(next_access->>'starts_at')::timestamptz THEN RAISE EXCEPTION 'Invalid automated access projection'; END IF;
  IF old_access.user_id IS NOT NULL AND (old_access.onboarding_date IS DISTINCT FROM (next_access->>'onboarding_date')::date OR old_access.time_zone IS DISTINCT FROM next_access->>'time_zone' OR old_access.starts_at IS DISTINCT FROM (next_access->>'starts_at')::timestamptz) THEN RAISE EXCEPTION 'Existing onboarding and timezone must remain intact'; END IF;
  INSERT INTO public.studio_access(user_id,phase,onboarding_date,time_zone,starts_at,expires_at,revoked_at,updated_by,updated_at)
  VALUES(owner,next_access->>'phase',(next_access->>'onboarding_date')::date,next_access->>'time_zone',(next_access->>'starts_at')::timestamptz,(next_access->>'expires_at')::timestamptz,NULL,NULL,clock_timestamp())
  ON CONFLICT(user_id) DO UPDATE SET phase=EXCLUDED.phase,expires_at=EXCLUDED.expires_at,updated_by=NULL,updated_at=EXCLUDED.updated_at
  RETURNING * INTO saved_access;
 ELSE
  IF old_access.user_id IS NOT NULL THEN RAISE EXCEPTION 'Billing never deletes an access record'; END IF;
 END IF;
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO entries FROM jsonb_array_elements(ledger->'entries') x WHERE x->>'ownerId' IS DISTINCT FROM owner::text;
 SELECT coalesce(jsonb_agg(x),'[]'::jsonb) INTO intents FROM jsonb_array_elements(ledger->'enrolmentIntents') x WHERE x->>'ownerId' IS DISTINCT FROM owner::text;
 ledger:=jsonb_set(jsonb_set(ledger,'{entries}',entries||(slice->'entries')),'{enrolmentIntents}',intents||(slice->'enrolmentIntents'));
 baseline:=jsonb_build_object('original',slice->'baseline'->'original','projected',CASE WHEN saved_access.user_id IS NULL THEN NULL ELSE to_jsonb(saved_access) END);
 ledger:=jsonb_set(ledger,'{billingAccessBaselines}',coalesce(ledger->'billingAccessBaselines','{}'::jsonb)||jsonb_build_object(owner::text,baseline));
 receipts:=receipts||jsonb_build_array(jsonb_build_object('key',receipt_key,'payload',p->>'payload','result',result,'source','stripe-or-approved-policy','at',clock_timestamp()));
 ledger:=jsonb_set(ledger,'{billingAccessReceipts}',coalesce(ledger->'billingAccessReceipts','{}'::jsonb)||jsonb_build_object(owner::text,receipts));
 UPDATE studio_private.service_ledger_v1 SET body=ledger WHERE singleton=true;
 RETURN jsonb_build_object('result',result,'access',CASE WHEN saved_access.user_id IS NULL THEN NULL ELSE to_jsonb(saved_access) END,'revision',md5(ledger::text));
END $billing$;
ROLLBACK;
