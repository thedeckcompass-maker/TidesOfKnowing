-- Report rows must show the reported target's author, not the parent discussion author.
-- No existing tasks or content are updated. Author snapshots apply to future reports.
SET LOCAL lock_timeout='5s';
DO $$BEGIN IF md5(pg_get_viewdef('studio_private.community_task_sources_v1'::regclass,true))<>'70508ded21bf5c6eac2972fe7bff8f0f' THEN RAISE EXCEPTION 'Inbox source contract changed';END IF;END$$;
CREATE OR REPLACE VIEW studio_private.community_task_sources_v1 AS
 SELECT 'question'::text kind,p.id source_id,p.id thread_id,p.author_id,p.studio_chapter pillar,p.created_at,p.updated_at,
 p.status, p.status='hidden' hidden, p.status IN('published','locked') visible,
 p.body excerpt,p.body ~* '(^|[^[:alnum:]_@])@leilia\y' mention,NULL::uuid reply_id,NULL::uuid report_id,NULL::text report_status
 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 UNION ALL
 SELECT 'comment',r.id,p.id,r.author_id,p.studio_chapter,r.created_at,r.updated_at,r.status,
 r.status='hidden' OR p.status='hidden',r.status='published' AND p.status IN('published','locked'),r.body,
 r.body ~* '(^|[^[:alnum:]_@])@leilia\y',r.id,NULL::uuid,NULL::text
 FROM public.community_replies r JOIN public.community_posts p ON p.id=r.post_id JOIN public.community_sections s ON s.id=p.section_id WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 UNION ALL
 SELECT 'report',r.id,p.id,coalesce(c.author_id,p.author_id),p.studio_chapter,r.created_at,coalesce(c.updated_at,p.updated_at),coalesce(c.status,p.status),
 coalesce(c.status,p.status)='hidden' OR p.status='hidden',r.status='open',r.reason||': '||coalesce(r.notes,''),false,r.reply_id,r.id,r.status
 FROM public.community_reports r LEFT JOIN public.community_replies c ON c.id=r.reply_id
 JOIN public.community_posts p ON p.id=coalesce(r.post_id,c.post_id) JOIN public.community_sections s ON s.id=p.section_id WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 UNION ALL
 SELECT 'editorial',r.id,r.id,r.owner_id,NULL,r.created_at,r.updated_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text FROM public.studio_editorial_requests r
 UNION ALL
 SELECT 'editorial',x.id,r.id,x.author_id,NULL,x.created_at,x.created_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text
 FROM public.studio_editorial_replies x JOIN public.studio_editorial_requests r ON r.id=x.request_id WHERE x.author_id=r.owner_id;
