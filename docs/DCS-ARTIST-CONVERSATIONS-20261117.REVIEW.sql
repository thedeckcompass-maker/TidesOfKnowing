-- REVIEW ONLY. Default ROLLBACK. Install only under separate verified-target approval.
-- Additive private persistence; no existing artist/profile/project/grant is changed.
BEGIN;
DO $$ BEGIN
 IF to_regprocedure('studio_private.artist_portfolio_dispatch_v1(text,jsonb)') IS NULL
 OR to_regprocedure('public.studio_project_can_edit_v1(uuid)') IS NULL THEN
  RAISE EXCEPTION 'Reviewed portfolio and project-level access contracts required';
 END IF;
END $$;
CREATE TABLE studio_private.artist_shortlists_v1(
 creator_id uuid NOT NULL REFERENCES public.profiles(id),project_id uuid NOT NULL REFERENCES public.studio_projects(id),
 artist_profile_id uuid NOT NULL REFERENCES public.studio_artist_profiles(id),artist_name text NOT NULL,project_label text NOT NULL,
 note text NOT NULL CHECK(length(note)<=1200),removed_at timestamptz,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(creator_id,project_id,artist_profile_id));
CREATE TABLE studio_private.artist_introductions_v1(
 id uuid PRIMARY KEY,creator_id uuid NOT NULL REFERENCES public.profiles(id),artist_id uuid NOT NULL REFERENCES public.profiles(id),
 project_id uuid NOT NULL REFERENCES public.studio_projects(id),artist_profile_id uuid NOT NULL REFERENCES public.studio_artist_profiles(id),
 body jsonb NOT NULL CHECK(jsonb_typeof(body)='object' AND octet_length(body::text)<=1000000),request_payload jsonb NOT NULL,
 creator_contact text NOT NULL,artist_contact text,status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','more_information','accepted','declined','withdrawn')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),CHECK(creator_id<>artist_id));
CREATE INDEX artist_introductions_creator_v1 ON studio_private.artist_introductions_v1(creator_id,created_at,id);
CREATE INDEX artist_introductions_artist_v1 ON studio_private.artist_introductions_v1(artist_id,created_at,id);
ALTER TABLE studio_private.artist_shortlists_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.artist_introductions_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON studio_private.artist_shortlists_v1,studio_private.artist_introductions_v1 FROM PUBLIC,anon,authenticated,dcs_service_executor;

CREATE FUNCTION studio_private.artist_introduction_view_v1(i studio_private.artist_introductions_v1) RETURNS jsonb
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT (i.body-'last_action'-'last_actor')||jsonb_build_object('id',i.id,'creator_id',i.creator_id,'project_id',i.project_id,'artist_profile_id',i.artist_profile_id,
 'status',i.status,'updated_at',i.updated_at,'my_contact_preview',(SELECT email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false) AND coalesce(email_change,'')=''),
 'contacts',CASE WHEN i.status='accepted' AND EXISTS(SELECT 1 FROM auth.users WHERE id=i.creator_id AND email=i.creator_contact AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false) AND coalesce(email_change,'')='')
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=i.artist_id AND email=i.artist_contact AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false) AND coalesce(email_change,'')='')
 THEN jsonb_build_object('creator',i.creator_contact,'artist',i.artist_contact) ELSE NULL END)
$$;
REVOKE ALL ON FUNCTION studio_private.artist_introduction_view_v1(studio_private.artist_introductions_v1) FROM PUBLIC,anon,authenticated,dcs_service_executor;

CREATE FUNCTION studio_private.artist_conversation_dispatch_v1(p_action text,p_input jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();mail text;project public.studio_projects%ROWTYPE;artist public.studio_artist_profiles%ROWTYPE;
 i studio_private.artist_introductions_v1%ROWTYPE;listing jsonb;items jsonb;notes jsonb;next_status text;stamp timestamptz:=clock_timestamp();
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'dcs_service_executor' OR actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND status='active') THEN RAISE EXCEPTION 'Verified active server actor required';END IF;
 IF p_input IS NULL OR jsonb_typeof(p_input)<>'object' OR octet_length(p_input::text)>40000 THEN RAISE EXCEPTION 'Bounded conversation request required';END IF;
 IF p_action='canCreator' THEN RETURN studio_private.artist_portfolio_dispatch_v1('canBrowse','{}');END IF;
 SELECT email INTO mail FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false) AND coalesce(email_change,'')='';
 IF p_action='read' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('project_id',s.project_id,'artist_profile_id',s.artist_profile_id,'project_label',s.project_label,'artist_name',s.artist_name,'note',s.note) ORDER BY s.updated_at,s.artist_profile_id),'[]') INTO notes FROM studio_private.artist_shortlists_v1 s WHERE s.creator_id=actor AND s.removed_at IS NULL;
  SELECT coalesce(jsonb_agg(studio_private.artist_introduction_view_v1(x) ORDER BY x.created_at,x.id),'[]') INTO items FROM studio_private.artist_introductions_v1 x WHERE x.creator_id=actor OR x.artist_id=actor;
  RETURN jsonb_build_object('shortlists',notes,'introductions',items);
 END IF;
 IF p_action IN ('shortlist','removeShortlist','request') THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,119));
  SELECT * INTO project FROM public.studio_projects WHERE id=(p_input->>'project_id')::uuid AND owner_id=actor FOR UPDATE;
  IF project.id IS NULL THEN RAISE EXCEPTION 'Owned project required';END IF;
  IF p_action='removeShortlist' THEN
   UPDATE studio_private.artist_shortlists_v1 SET removed_at=stamp,updated_at=stamp WHERE creator_id=actor AND project_id=project.id AND artist_profile_id=(p_input->>'artist_profile_id')::uuid;
   RETURN jsonb_build_object('saved',true);
  END IF;
  IF studio_private.artist_portfolio_dispatch_v1('canBrowse','{}') IS DISTINCT FROM 'true'::jsonb OR public.studio_project_can_edit_v1(project.id) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Eligible creator and project access required';END IF;
  listing:=studio_private.artist_portfolio_dispatch_v1('directoryProfile',jsonb_build_object('id',p_input->>'artist_profile_id'));
  IF jsonb_typeof(listing) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Approved artist required';END IF;
  SELECT * INTO artist FROM public.studio_artist_profiles WHERE id=(listing->>'id')::uuid;
  IF artist.id IS NULL OR artist.user_id=actor THEN RAISE EXCEPTION 'Choose another approved artist';END IF;
  IF p_action='shortlist' THEN
   IF length(coalesce(p_input->>'note',''))>1200 THEN RAISE EXCEPTION 'Shortlist note too long';END IF;
   INSERT INTO studio_private.artist_shortlists_v1(creator_id,project_id,artist_profile_id,artist_name,project_label,note)
   VALUES(actor,project.id,artist.id,listing->>'professional_name',project.name,coalesce(p_input->>'note',''))
   ON CONFLICT(creator_id,project_id,artist_profile_id) DO UPDATE SET note=excluded.note,artist_name=excluded.artist_name,project_label=excluded.project_label,removed_at=NULL,updated_at=stamp;
   RETURN jsonb_build_object('saved',true);
  END IF;
  IF mail IS NULL OR p_input->>'confirmed' IS DISTINCT FROM 'true' OR p_input->>'contactConfirmed' IS DISTINCT FROM 'true'
  OR p_input->>'directContractConfirmed' IS DISTINCT FROM 'true' OR p_input->>'project_label' IS DISTINCT FROM project.name OR p_input->>'expected_artist_name' IS DISTINCT FROM listing->>'professional_name'
  OR length(trim(coalesce(p_input->>'brief',''))) NOT BETWEEN 50 AND 5000 OR length(coalesce(p_input->>'timeline',''))>800 OR length(coalesce(p_input->>'budget_context',''))>800 THEN RAISE EXCEPTION 'Verified contact, exact brief and explicit consent required';END IF;
  IF p_input->>'request_id' IS NULL THEN RAISE EXCEPTION 'Stable introduction identity required';END IF;
  SELECT * INTO i FROM studio_private.artist_introductions_v1 WHERE id=(p_input->>'request_id')::uuid FOR UPDATE;
  IF i.id IS NOT NULL THEN
   IF i.creator_id<>actor OR i.request_payload IS DISTINCT FROM p_input THEN RAISE EXCEPTION 'Introduction retry changed';END IF;
   RETURN jsonb_build_object('id',i.id,'repeated',true);
  END IF;
  INSERT INTO studio_private.artist_introductions_v1(id,creator_id,artist_id,project_id,artist_profile_id,creator_contact,request_payload,body)
  VALUES((p_input->>'request_id')::uuid,actor,artist.user_id,project.id,artist.id,mail,p_input,
   jsonb_build_object('artist_name',listing->>'professional_name','project_label',project.name,'brief',p_input->>'brief','timeline',coalesce(p_input->>'timeline',''),'budget_context',coalesce(p_input->>'budget_context',''),
   'history',jsonb_build_array(jsonb_build_object('by',actor,'to','requested','at',stamp))));
  RETURN jsonb_build_object('id',p_input->>'request_id','repeated',false);
 END IF;
 IF p_action='respond' THEN
  SELECT * INTO i FROM studio_private.artist_introductions_v1 WHERE id=(p_input->>'id')::uuid AND (creator_id=actor OR artist_id=actor) FOR UPDATE;
  IF i.id IS NULL THEN RAISE EXCEPTION 'Participant introduction required';END IF;
  IF i.body->'last_action'=p_input AND i.body->>'last_actor'=actor::text THEN RETURN studio_private.artist_introduction_view_v1(i);END IF;
  IF p_input->>'expected_updated_at' IS DISTINCT FROM to_jsonb(i)->>'updated_at' OR length(coalesce(p_input->>'message',''))>2000 THEN RAISE EXCEPTION 'Introduction changed; reload before responding';END IF;
  next_status:=p_input->>'action';
  IF i.status IN ('declined','withdrawn') THEN RAISE EXCEPTION 'Introduction is closed';END IF;
  IF next_status='withdrawn' THEN NULL;
  ELSIF actor=i.creator_id THEN
   IF next_status<>'reply' OR i.status<>'more_information' OR length(trim(coalesce(p_input->>'message','')))=0 THEN RAISE EXCEPTION 'Only the requested creator reply is permitted';END IF;
   next_status:='requested';
  ELSE
   IF next_status IS NULL OR next_status NOT IN ('accepted','declined','more_information') OR i.status NOT IN ('requested','more_information') THEN RAISE EXCEPTION 'Unsupported artist response';END IF;
   IF next_status='more_information' AND length(trim(coalesce(p_input->>'message','')))=0 THEN RAISE EXCEPTION 'Explain the information needed';END IF;
   IF next_status='accepted' AND (mail IS NULL OR p_input->>'consent' IS DISTINCT FROM 'true' OR p_input->>'expectedArtistContact' IS DISTINCT FROM mail
    OR NOT EXISTS(SELECT 1 FROM studio_private.artist_published_profiles_v1 pub JOIN public.studio_artist_profiles a ON a.id=pub.profile_id WHERE pub.user_id=actor AND pub.profile_id=i.artist_profile_id AND a.user_id=actor AND a.registration_status='active')
    OR EXISTS(SELECT 1 FROM studio_private.artist_registration_v1 r WHERE r.user_id=actor AND (r.status<>'active' OR r.participation_role NOT IN ('artist','both')))) THEN RAISE EXCEPTION 'Current artist and explicit verified contact consent required';END IF;
  END IF;
  i.body:=i.body||jsonb_build_object('history',i.body->'history'||jsonb_build_array(jsonb_build_object('by',actor,'to',next_status,'at',stamp,'message',coalesce(p_input->>'message',''))),'last_action',p_input,'last_actor',actor);
  IF actor=i.artist_id THEN i.body:=i.body||jsonb_build_object('artist_message',coalesce(p_input->>'message',''));ELSE i.body:=i.body||jsonb_build_object('creator_reply',coalesce(p_input->>'message',''));END IF;
  UPDATE studio_private.artist_introductions_v1 SET status=next_status,body=i.body,updated_at=stamp,artist_contact=CASE WHEN next_status='accepted' THEN mail ELSE NULL END WHERE id=i.id RETURNING * INTO i;
  RETURN studio_private.artist_introduction_view_v1(i);
 END IF;
 RAISE EXCEPTION 'Unsupported conversation action';
END $$;
REVOKE ALL ON FUNCTION studio_private.artist_conversation_dispatch_v1(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION studio_private.artist_conversation_dispatch_v1(text,jsonb) TO dcs_service_executor;
ROLLBACK;
