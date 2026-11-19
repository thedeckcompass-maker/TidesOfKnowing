-- LOCAL REVIEW ONLY. No production execution authorised. Preserve existing ownership policies and paid-write helper.
BEGIN;
DO $guard$ BEGIN
 -- Exact installed definitions captured at .241; names alone cannot authorize changed semantics.
 IF to_regprocedure('studio_private.editorial_history_access_v1(uuid,boolean)') IS NULL OR md5(pg_get_functiondef(to_regprocedure('studio_private.editorial_history_access_v1(uuid,boolean)'))) <> '9a30e1dea95a0a25c483973d38338271' THEN RAISE EXCEPTION 'Verified editorial retention consumer changed: editorial_history_access_v1'; END IF;
 IF to_regprocedure('studio_private.editorial_owner_read_v1(uuid)') IS NULL OR md5(pg_get_functiondef(to_regprocedure('studio_private.editorial_owner_read_v1(uuid)'))) <> '03505a1c4286980ada03f329a2485f84' THEN RAISE EXCEPTION 'Verified editorial retention consumer changed: editorial_owner_read_v1'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','studio_private') AND p.proname<>'owner_download_grace_v1' AND p.oid NOT IN (to_regprocedure('studio_private.editorial_history_access_v1(uuid,boolean)'),to_regprocedure('studio_private.editorial_owner_read_v1(uuid)')) AND position('owner_download_grace_v1' IN CASE WHEN p.prokind='f' THEN pg_get_functiondef(p.oid) ELSE '' END)>0) THEN RAISE EXCEPTION 'Unexpected retention-helper function consumer; inspect before changing';END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND cmd<>'SELECT' AND (coalesce(qual,'') LIKE '%owner_download_grace_v1%' OR coalesce(with_check,'') LIKE '%owner_download_grace_v1%')) THEN RAISE EXCEPTION 'Unexpected retention helper use in a write policy; review before changing';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='studio_creator_inspiration' AND policyname='creator_inspiration_own_read' AND cmd='SELECT') THEN RAISE EXCEPTION 'Inspiration read policy differs from verified reference; review first';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='studio_projects' AND policyname='Studio entitlement required for reading' AND cmd='SELECT' AND permissive='RESTRICTIVE' AND md5(qual)='ecccf002b66316c57eb919589262c9e5') THEN RAISE EXCEPTION 'Captured studio_projects read policy changed; review before applying'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='studio_creator_inspiration' AND policyname='creator_inspiration_own_read' AND cmd='SELECT' AND permissive='PERMISSIVE' AND md5(qual)='bcac2728cfb5e14da3792cf9cae14dbd') THEN RAISE EXCEPTION 'Captured studio_creator_inspiration read policy changed; review before applying'; END IF;
END $guard$;
CREATE OR REPLACE FUNCTION studio_private.owner_download_grace_v1() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $function$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.status='active');
$function$;
CREATE OR REPLACE FUNCTION public.studio_creator_inspiration_save_v1(request_id uuid, text_value text, image_value jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor uuid:=auth.uid(); saved jsonb; prior jsonb; entry jsonb; candidate jsonb; k text;
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.status='active') THEN RAISE EXCEPTION 'Active account required' USING ERRCODE='42501'; END IF;
 IF request_id IS NULL OR text_value IS NULL OR length(text_value)>20000 OR (btrim(text_value)='' AND (image_value IS NULL OR image_value='null'::jsonb)) THEN RAISE EXCEPTION 'Add bounded writing or an image'; END IF;
 IF image_value='null'::jsonb THEN image_value:=NULL; END IF;
 IF image_value IS NOT NULL THEN
  IF jsonb_typeof(image_value)<>'object' OR octet_length(image_value::text)>420000 THEN RAISE EXCEPTION 'Invalid image reference'; END IF;
  FOR k IN SELECT jsonb_object_keys(image_value) LOOP IF NOT k=ANY(ARRAY['name','hash','bytes','width','height','preview','mode','x','y','zoom']) THEN RAISE EXCEPTION 'Unsupported image field'; END IF; END LOOP;
  IF (SELECT count(*) FROM jsonb_object_keys(image_value))<>10 OR jsonb_typeof(image_value->'name')<>'string' OR length(image_value->>'name') NOT BETWEEN 1 AND 180 OR image_value->>'name' ~ '[[:cntrl:]/\\]' OR image_value->>'hash' !~ '^[a-f0-9]{64}$' OR image_value->>'mode'<>'external-original' OR image_value->>'preview' !~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$' THEN RAISE EXCEPTION 'Invalid image reference'; END IF;
  FOREACH k IN ARRAY ARRAY['name','hash','mode','preview'] LOOP IF jsonb_typeof(image_value->k)<>'string' THEN RAISE EXCEPTION 'Invalid image field'; END IF; END LOOP;
  FOREACH k IN ARRAY ARRAY['bytes','width','height','x','y','zoom'] LOOP IF jsonb_typeof(image_value->k)<>'number' THEN RAISE EXCEPTION 'Invalid image dimensions'; END IF; END LOOP;
  IF (image_value->>'bytes')::numeric NOT BETWEEN 1 AND 20971520 OR (image_value->>'width')::numeric NOT BETWEEN 1 AND 16000 OR (image_value->>'height')::numeric NOT BETWEEN 1 AND 16000 OR (image_value->>'width')::numeric*(image_value->>'height')::numeric>48000000 OR (image_value->>'x')::numeric NOT BETWEEN -25 AND 25 OR (image_value->>'y')::numeric NOT BETWEEN -25 AND 25 OR (image_value->>'zoom')::numeric NOT BETWEEN 1 AND 2 OR octet_length(decode(split_part(image_value->>'preview',',',2),'base64'))>300000 OR substring(decode(split_part(image_value->>'preview',',',2),'base64') from 1 for 2)<>decode('ffd8','hex') THEN RAISE EXCEPTION 'Image bounds exceeded'; END IF;
 END IF;
 INSERT INTO public.studio_creator_inspiration(owner_id) VALUES(actor) ON CONFLICT(owner_id) DO NOTHING;
 SELECT inbox INTO saved FROM public.studio_creator_inspiration WHERE owner_id=actor FOR UPDATE;
 SELECT e INTO prior FROM jsonb_array_elements(saved->'entries') e WHERE e->>'id'=request_id::text;
 IF prior IS NOT NULL THEN IF prior->>'text'<>text_value OR prior->'image' IS DISTINCT FROM coalesce(image_value,'null'::jsonb) THEN RAISE EXCEPTION 'Capture receipt already used for different content'; END IF; RETURN prior; END IF;
 entry:=jsonb_build_object('id',request_id,'text',text_value,'image',image_value,'createdAt',now(),'assignment',NULL,'projectLink',NULL);
 candidate:=jsonb_set(saved,'{entries}',(saved->'entries')||jsonb_build_array(entry));
 UPDATE public.studio_creator_inspiration SET inbox=candidate,revision=revision+1,updated_at=now() WHERE owner_id=actor;
 RETURN entry;
END $function$
;
ALTER POLICY creator_inspiration_own_read ON public.studio_creator_inspiration USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.status='active'));
ALTER POLICY "Studio entitlement required for reading" ON public.studio_projects USING (studio_private.has_access() OR (owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.status='active')));
-- Existing grants, ownership policies, paid writes, capture bounds and ten-field image validation are unchanged.
ROLLBACK;
