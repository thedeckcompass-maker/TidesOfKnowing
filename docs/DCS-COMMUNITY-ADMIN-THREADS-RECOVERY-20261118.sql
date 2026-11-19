BEGIN;
DO $guard$ BEGIN IF md5(pg_get_functiondef('public.studio_dcs_community_admin_read_v1()'::regprocedure)) <> '61f9781dc10229e981b2a09fdad0f11f' THEN RAISE EXCEPTION 'STOP_READ_CONTRACT_DRIFT'; END IF; END $guard$;
CREATE OR REPLACE FUNCTION public.studio_dcs_community_admin_read_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'status',p.status,'updated_at',p.updated_at,'chapter',p.studio_chapter,'capability',CASE s.key WHEN 'studio-general' THEN 'general_community' WHEN 'studio-general-qa' THEN 'general_community' ELSE 'private_community' END,'question',p.body,'selected_text',p.studio_selected_text,'replies',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'status',r.status,'updated_at',r.updated_at,'body',r.body,'created_at',r.created_at) ORDER BY r.created_at,r.id) FROM public.community_replies r WHERE r.post_id=p.id),'[]'::jsonb)) ORDER BY p.created_at,p.id),'[]'::jsonb) FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE p.studio_chapter IS NOT NULL AND p.status IN ('published','locked','hidden') AND s.is_active AND studio_private.room_allowed(s.id) AND studio_private.community_qa_section_v1(s.id) AND s.key IN ('studio-general','deck-creator-studio','studio-general-qa','studio-private-qa'));
END $function$
;
COMMIT;
