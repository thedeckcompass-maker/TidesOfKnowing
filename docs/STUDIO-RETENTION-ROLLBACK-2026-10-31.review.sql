-- REVIEW ONLY. Restore only after separate rollback approval and before-state revalidation.
-- Restores old expiry limits; no content deletion.
BEGIN;
CREATE OR REPLACE FUNCTION public.studio_creator_inspiration_save_v1(request_id uuid, text_value text, image_value jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor uuid:=auth.uid(); saved jsonb; prior jsonb; entry jsonb; candidate jsonb; k text;
BEGIN
 IF actor IS NULL OR NOT studio_private.has_access() OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND p.status='active') THEN RAISE EXCEPTION 'Active Studio access required' USING ERRCODE='42501'; END IF;
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
CREATE OR REPLACE FUNCTION studio_private.owner_download_grace_v1()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p JOIN public.studio_access a ON a.user_id=p.id WHERE p.id=auth.uid() AND p.status='active' AND a.revoked_at IS NULL AND isfinite(a.starts_at) AND isfinite(a.expires_at) AND a.expires_at>a.starts_at AND a.starts_at<=now() AND now()>=a.expires_at AND now()<a.expires_at+interval '28 days');
$function$
;
ALTER POLICY "creator_inspiration_own_read" ON public.studio_creator_inspiration USING (((owner_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.status = 'active'::text)))) AND (studio_private.has_access() OR (EXISTS ( SELECT 1
   FROM studio_access a
  WHERE ((a.user_id = auth.uid()) AND (a.revoked_at IS NULL) AND isfinite(a.starts_at) AND isfinite(a.expires_at) AND (a.expires_at > a.starts_at) AND (a.starts_at <= now()) AND (now() >= a.expires_at) AND (now() < (a.expires_at + '28 days'::interval))))))));
ALTER POLICY "Studio entitlement required for reading" ON public.studio_projects USING ((studio_private.has_access() OR ((owner_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (profiles p
     JOIN studio_access a ON ((a.user_id = p.id)))
  WHERE ((p.id = auth.uid()) AND (p.status = 'active'::text) AND (a.revoked_at IS NULL) AND isfinite(a.starts_at) AND isfinite(a.expires_at) AND (a.expires_at > a.starts_at) AND (a.starts_at <= now()) AND (now() >= a.expires_at) AND (now() < (a.expires_at + '672:00:00'::interval))))))));
ROLLBACK;
