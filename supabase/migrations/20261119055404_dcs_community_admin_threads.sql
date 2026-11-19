-- Authorised DCS staff-only hierarchy/attention read extension. No data writes or permission changes.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='20s';
DO $guard$ BEGIN IF (SELECT md5(pg_get_functiondef('public.studio_dcs_community_admin_read_v1()'::regprocedure))) <> '825b8b709beebe53617eee993af886d1' THEN RAISE EXCEPTION 'STOP_ADMIN_READ_DRIFT'; END IF; IF (SELECT proacl::text FROM pg_proc WHERE oid='public.studio_dcs_community_admin_read_v1()'::regprocedure) <> '{postgres=X/postgres,authenticated=X/postgres}' THEN RAISE EXCEPTION 'STOP_ADMIN_PRIVILEGE_DRIFT'; END IF; END $guard$;
CREATE OR REPLACE FUNCTION public.studio_dcs_community_admin_read_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'contract_version',2,'created_at',p.created_at,'author_username',(SELECT u.username FROM public.community_usernames u WHERE u.user_id=p.author_id),'mentions_leilia',p.body ~* '(^|[^[:alnum:]_@])@leilia([^[:alnum:]_]|$)','open_report_count',(SELECT count(*) FROM public.community_reports x WHERE x.post_id=p.id AND x.reply_id IS NULL AND x.status='open'),'scribe_count',(SELECT count(*) FROM public.studio_community_scribes x WHERE x.post_id=p.id AND x.reply_id IS NULL),'status',p.status,'updated_at',p.updated_at,'chapter',p.studio_chapter,'capability',CASE s.key WHEN 'studio-general' THEN 'general_community' WHEN 'studio-general-qa' THEN 'general_community' ELSE 'private_community' END,'question',p.body,'selected_text',p.studio_selected_text,'replies',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'parent_reply_id',r.parent_reply_id,'author_username',(SELECT u.username FROM public.community_usernames u WHERE u.user_id=r.author_id),'mentions_leilia',r.body ~* '(^|[^[:alnum:]_@])@leilia([^[:alnum:]_]|$)','open_report_count',(SELECT count(*) FROM public.community_reports x WHERE x.reply_id=r.id AND x.status='open'),'scribe_count',(SELECT count(*) FROM public.studio_community_scribes x WHERE x.post_id=p.id AND x.reply_id=r.id),'status',r.status,'updated_at',r.updated_at,'body',r.body,'created_at',r.created_at) ORDER BY r.created_at,r.id) FROM public.community_replies r WHERE r.post_id=p.id),'[]'::jsonb)) ORDER BY p.created_at,p.id),'[]'::jsonb) FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE p.studio_chapter IS NOT NULL AND p.status IN ('published','locked','hidden') AND s.is_active AND studio_private.room_allowed(s.id) AND studio_private.community_qa_section_v1(s.id) AND s.key IN ('studio-general','deck-creator-studio','studio-general-qa','studio-private-qa'));
END $function$;

DO $verify$ BEGIN IF (SELECT proacl::text FROM pg_proc WHERE oid='public.studio_dcs_community_admin_read_v1()'::regprocedure) <> '{postgres=X/postgres,authenticated=X/postgres}' OR (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='public.studio_dcs_community_admin_read_v1()'::regprocedure) <> 'postgres' THEN RAISE EXCEPTION 'STOP_ADMIN_SECURITY_CHANGED'; END IF; END $verify$;
COMMIT;
