-- Owner-authorised admin view/filter correction only. No content or task writes.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $guard$ BEGIN IF md5(pg_get_functiondef('public.studio_dcs_inbox_read_v1(jsonb)'::regprocedure)) <> '0b78209db030f0f8f75b32f3be7d4714' THEN RAISE EXCEPTION 'Inbox read contract drift; stop before replacement'; END IF; END $guard$;
CREATE OR REPLACE FUNCTION public.studio_dcs_inbox_read_v1(p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb; tab text:=coalesce(p->>'tab','inbox'); page integer:=greatest(1,least(100000,coalesce((p->>'page')::integer,1))); total integer; rows jsonb; pillar_counts jsonb;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 IF tab NOT IN('inbox','done','hidden','log') OR length(p::text)>2000 THEN RAISE EXCEPTION 'Invalid inbox filters';END IF;
 SELECT jsonb_build_object(
 'new',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind IN('question','comment') AND t.completed_at IS NULL AND s.visible AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'mentions',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind IN('question','comment') AND t.completed_at IS NULL AND s.visible AND s.mention AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'reports',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind='report' AND s.report_status='open'),
 'editorial',(SELECT count(*) FROM studio_private.community_tasks_v1 t WHERE t.kind='editorial' AND t.completed_at IS NULL AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'outstanding',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.completed_at IS NULL AND (t.kind='editorial' OR (t.kind='report' AND s.report_status='open') OR (t.kind IN('question','comment') AND s.visible))),
 'pillars','{}'::jsonb
 ) INTO result;
 IF tab='log' THEN
  SELECT count(*) INTO total FROM public.moderation_actions a JOIN public.community_posts c ON c.id=a.post_id WHERE c.studio_chapter IS NOT NULL AND(coalesce(p->>'pillar','')='' OR c.studio_chapter=p->>'pillar') AND(coalesce(p->>'month','')='' OR to_char(a.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month');
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM(SELECT a.id,a.action,a.reason,a.created_at,a.admin_user_id,coalesce(u.username,'Administrator') handler,a.post_id,a.reply_id,c.studio_chapter pillar FROM public.moderation_actions a JOIN public.community_posts c ON c.id=a.post_id LEFT JOIN public.community_usernames u ON u.user_id=a.admin_user_id WHERE c.studio_chapter IS NOT NULL AND(coalesce(p->>'pillar','')='' OR c.studio_chapter=p->>'pillar') AND(coalesce(p->>'month','')='' OR to_char(a.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month') ORDER BY a.created_at DESC,a.id LIMIT 25 OFFSET (page-1)*25) x;
  SELECT coalesce(jsonb_object_agg(pillar,n),'{}'::jsonb) INTO pillar_counts FROM(SELECT c.studio_chapter pillar,count(*) n FROM public.moderation_actions a JOIN public.community_posts c ON c.id=a.post_id WHERE c.studio_chapter IS NOT NULL AND(coalesce(p->>'month','')='' OR to_char(a.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month') GROUP BY c.studio_chapter) v;
 ELSIF tab='hidden' THEN
  SELECT count(*) INTO total FROM studio_private.community_task_sources_v1 s WHERE s.kind IN('question','comment') AND s.hidden
   AND(coalesce(p->>'pillar','')='' OR s.pillar=p->>'pillar') AND(coalesce(p->>'month','')='' OR to_char(s.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month');
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM(
   SELECT coalesce(t.id,s.source_id) id,s.kind,s.source_id,s.thread_id,s.pillar,t.tier,t.founder,s.created_at,s.updated_at,s.status,s.hidden,s.visible,s.reply_id,s.report_id,
   coalesce(t.version,0) version,t.completed_at,coalesce(u.username,'Community member') author,left(s.excerpt,320) excerpt,
   CASE WHEN t.id IS NULL THEN CASE WHEN EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 e WHERE e.kind=s.kind AND e.source_id=s.source_id) THEN 'Preserved test content' ELSE 'Preserved content' END WHEN t.completed_at IS NOT NULL THEN 'Done' ELSE 'Opened' END state,t.id IS NULL moderation_only
   FROM studio_private.community_task_sources_v1 s LEFT JOIN studio_private.community_tasks_v1 t USING(kind,source_id) LEFT JOIN public.community_usernames u ON u.user_id=s.author_id
   WHERE s.kind IN('question','comment') AND s.hidden AND(coalesce(p->>'pillar','')='' OR s.pillar=p->>'pillar') AND(coalesce(p->>'month','')='' OR to_char(s.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month') ORDER BY CASE WHEN p->>'sort'='newest' THEN s.created_at END DESC,CASE WHEN p->>'sort' IS DISTINCT FROM 'newest' THEN s.created_at END ASC,s.source_id LIMIT 25 OFFSET (page-1)*25
  ) x;
  SELECT coalesce(jsonb_object_agg(pillar,n),'{}'::jsonb) INTO pillar_counts FROM(SELECT s.pillar,count(*) n FROM studio_private.community_task_sources_v1 s WHERE s.kind IN('question','comment') AND s.hidden AND(coalesce(p->>'month','')='' OR to_char(s.created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month') GROUP BY s.pillar) v;
 ELSE
  WITH base AS(
   SELECT t.id,t.kind,t.thread_id,t.source_id,t.pillar,t.tier,t.founder,t.created_at,t.completed_at,t.completed_by,t.version,t.completion_method,
   s.status,s.hidden,s.visible,s.updated_at,s.mention,s.reply_id,s.report_id,s.report_status,s.excerpt search_body,left(coalesce(s.excerpt,'Content removed after retention period'),320) excerpt,
   coalesce(u.username,'Community member') author,coalesce(h.username,'Administrator') handler,
   CASE WHEN t.completed_at IS NOT NULL THEN 'Done' WHEN r.task_id IS NOT NULL THEN 'Opened' ELSE 'New' END state
   FROM studio_private.community_tasks_v1 t LEFT JOIN studio_private.community_task_sources_v1 s USING(kind,source_id)
   LEFT JOIN studio_private.community_task_reads_v1 r ON r.task_id=t.id AND r.admin_id=auth.uid()
   LEFT JOIN public.community_usernames u ON u.user_id=t.author_id LEFT JOIN public.community_usernames h ON h.user_id=t.completed_by WHERE t.kind<>'editorial'
  ), filtered AS(SELECT * FROM base b WHERE
   (CASE tab WHEN 'inbox' THEN completed_at IS NULL AND (visible OR (kind='report' AND report_status='open')) WHEN 'done' THEN completed_at IS NOT NULL WHEN 'hidden' THEN hidden AND kind<>'report' ELSE false END)
   AND (coalesce(p->>'month','')='' OR to_char(created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month')
   AND (coalesce(p->>'type','')='' OR kind=p->>'type') AND (coalesce(p->>'tier','')='' OR tier=p->>'tier')
   AND (coalesce(p->>'handled','')='' OR completed_by::text=p->>'handled')
   AND (coalesce(p->>'q','')='' OR position(lower(p->>'q') IN lower(coalesce(search_body,'')||' '||author))>0)
   AND (coalesce(p->>'focus','')='' OR (p->>'focus'='mentions' AND mention) OR (p->>'focus'='reports' AND kind='report') OR (p->>'focus'='new' AND state='New' AND kind IN('question','comment')))
  ), selected AS(SELECT * FROM filtered WHERE coalesce(p->>'pillar','')='' OR pillar=p->>'pillar'), sliced AS(SELECT * FROM selected ORDER BY CASE WHEN p->>'sort'='newest' THEN created_at END DESC,CASE WHEN p->>'sort' IS DISTINCT FROM 'newest' THEN created_at END ASC,id LIMIT 25 OFFSET (page-1)*25)
  SELECT (SELECT count(*) FROM selected),coalesce((SELECT jsonb_agg(to_jsonb(sliced)-'search_body') FROM sliced),'[]'),(SELECT coalesce(jsonb_object_agg(pillar,n),'{}'::jsonb) FROM(SELECT pillar,count(*) n FROM filtered GROUP BY pillar) v) INTO total,rows,pillar_counts;
 END IF;
 result:=jsonb_set(result,'{pillars}',coalesce(pillar_counts,'{}'::jsonb));
 RETURN jsonb_build_object('version',1,'counters',result,'rows',rows,'total',total,'page',page,'pageSize',25);
END$function$
;
