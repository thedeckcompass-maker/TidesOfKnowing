-- REVIEW ONLY: missing Creator's Desk persistence for the registered preview demo.
-- No service allocations, billing, retention or historical entitlement changes.
BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM dcs_demo.environment WHERE singleton AND project_ref='utzcmbidotxgmulguzxo') THEN RAISE EXCEPTION 'Preview required';END IF;END $$;
CREATE FUNCTION dcs_demo.inspiration_owner_allowed(writing boolean) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM dcs_demo.preview_owners b WHERE b.owner_id=auth.uid() AND dcs_demo.can_access(b.project_id,writing));
$$;
REVOKE ALL ON FUNCTION dcs_demo.inspiration_owner_allowed(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dcs_demo.inspiration_owner_allowed(boolean) TO authenticated;
CREATE TABLE public.studio_creator_inspiration(
 owner_id uuid PRIMARY KEY REFERENCES public.profiles(id),
 inbox jsonb NOT NULL DEFAULT '{"version":1,"entries":[]}'::jsonb CHECK(inbox->>'version'='1' AND jsonb_typeof(inbox->'entries')='array' AND jsonb_array_length(inbox->'entries')<=1000),
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_creator_inspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_creator_inspiration FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.studio_creator_inspiration FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.studio_creator_inspiration TO authenticated;
CREATE POLICY creator_inspiration_own_read ON public.studio_creator_inspiration FOR SELECT TO authenticated USING(owner_id=auth.uid() AND dcs_demo.inspiration_owner_allowed(false));
CREATE FUNCTION public.studio_creator_inspiration_save_v1(request_id uuid, text_value text, image_value jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor uuid:=auth.uid(); saved jsonb; prior jsonb; entry jsonb; candidate jsonb; k text;
BEGIN
 IF actor IS NULL OR NOT dcs_demo.inspiration_owner_allowed(true) THEN RAISE EXCEPTION 'Active account required' USING ERRCODE='42501'; END IF;
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

create function public.studio_explore_inspiration_link_v1(capture_id uuid, project_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid(); saved jsonb; entry jsonb; pos integer; settings_value jsonb; collection jsonb; existing jsonb; receipt jsonb; stamp timestamptz;
begin
 if actor is null or (not public.studio_project_can_edit_v1(project_id) or not dcs_demo.inspiration_owner_allowed(true)) then
   raise exception 'Active owned project required' using errcode='42501';
 end if;
 select inbox into saved from public.studio_creator_inspiration where owner_id=actor for update;
 select e.value,(e.ordinality-1)::integer into entry,pos from jsonb_array_elements(saved->'entries') with ordinality e(value,ordinality) where e.value->>'id'=capture_id::text;
 if entry is null then raise exception 'Owned inspiration not found'; end if;
 select p.settings,p.updated_at into settings_value,stamp from public.studio_projects p
   where p.id=project_id and p.owner_id=actor and p.deleted_at is null and p.status <> 'archived' for update;
 if not found then raise exception 'Owned project not found' using errcode='42501'; end if;
 if entry->'projectLink' is not null and entry->'projectLink'<>'null'::jsonb then
   if entry->'projectLink'->>'projectId'<>project_id::text then raise exception 'This inspiration is already linked to another project'; end if;
   return jsonb_build_object('projectId',project_id,'captureId',capture_id,'updatedAt',stamp);
 end if;
 settings_value:=coalesce(settings_value,'{}'::jsonb); collection:=coalesce(settings_value->'creative_inbox_v1','{"version":1,"entries":[]}'::jsonb);
 if collection->>'version'<>'1' or jsonb_typeof(collection->'entries')<>'array' then raise exception 'Project inspiration needs review'; end if;
 select e into existing from jsonb_array_elements(collection->'entries') e where e->>'id'=capture_id::text;
 if existing is not null then
   if existing->>'text'<>entry->>'text' or existing->'image' is distinct from entry->'image' then raise exception 'Project capture identity conflict'; end if;
 else collection:=jsonb_set(collection,'{entries}',(collection->'entries')||jsonb_build_array(entry-'projectLink')); end if;
 settings_value:=jsonb_set(settings_value,'{creative_inbox_v1}',collection);
 if jsonb_array_length(collection->'entries')>1000 or octet_length(settings_value::text)>6500000 then raise exception 'Project capture limit reached'; end if;
 update public.studio_projects p set settings=settings_value where p.id=project_id and p.owner_id=actor returning p.updated_at into stamp;
 receipt:=jsonb_build_object('projectId',project_id,'captureId',capture_id,'at',now());
 saved:=jsonb_set(saved,array['entries',pos::text,'projectLink'],receipt);
 update public.studio_creator_inspiration set inbox=saved,revision=revision+1,updated_at=now() where owner_id=actor;
 return jsonb_build_object('projectId',project_id,'captureId',capture_id,'updatedAt',stamp);
end $$;
REVOKE ALL ON FUNCTION public.studio_creator_inspiration_save_v1(uuid,text,jsonb),public.studio_explore_inspiration_link_v1(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_creator_inspiration_save_v1(uuid,text,jsonb),public.studio_explore_inspiration_link_v1(uuid,uuid) TO authenticated;
ROLLBACK;
