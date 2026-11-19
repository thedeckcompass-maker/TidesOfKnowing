-- Owner-approved shared inbox. No retention job, new staff role, entitlement or account writes.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $$BEGIN
 IF to_regprocedure('studio_private.dcs_community_staff_v1()') IS NULL
 OR to_regprocedure('public.studio_dcs_community_member_reply_v2(uuid,uuid,text,uuid)') IS NULL
 OR to_regprocedure('public.studio_dcs_community_moderate_v1(uuid,uuid,text,timestamp with time zone,text,uuid,uuid)') IS NULL
 THEN RAISE EXCEPTION 'Inbox prerequisite unavailable';END IF;
 IF md5(pg_get_functiondef('public.studio_dcs_community_member_reply_v2(uuid,uuid,text,uuid)'::regprocedure))<>'1fc9a3d782884a2b769a7dfbd9546fbc'
 OR md5(pg_get_functiondef('public.studio_dcs_community_moderate_v1(uuid,uuid,text,timestamptz,text,uuid,uuid)'::regprocedure))<>'e27a456d7f0fa6abcff1328ec8e1fa47'
 THEN RAISE EXCEPTION 'Accepted Community write contract changed';END IF;
 IF EXISTS(SELECT 1 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE s.key IN('deck-creator-studio','studio-private-qa')) THEN RAISE EXCEPTION 'Private content requires separate reconciliation';END IF;
END$$;

CREATE TABLE studio_private.community_task_exclusions_v1(
 kind text NOT NULL CHECK(kind IN('question','comment')), source_id uuid NOT NULL, provenance text NOT NULL, PRIMARY KEY(kind,source_id)
);
INSERT INTO studio_private.community_task_exclusions_v1 VALUES
 ('question','aac5b508-fb47-4b8b-809e-366d36138c02','Owner-preserved legacy Spark test question; excluded 2026-11-19'),
 ('question','11c1b759-13c9-4e62-a3fa-fca92272ea0b','TEST-DCS-S7-20261112-R1 A; owner-preserved'),
 ('question','f1e0b806-2418-4c3c-a5ea-c6af9051d079','TEST-DCS-S7-20261112-R1 B; owner-preserved'),
 ('comment','72521e3f-2deb-4ea7-8742-aa86d0a056a1','Owner-preserved legacy Spark test reply'),
 ('comment','37b3d458-2d9e-47cc-b533-808d45897e2e','TEST-DCS-S7-20261112-R1 B copy; owner-preserved'),
 ('comment','7c3ff62d-8965-4129-9c7f-45e7690645fb','TEST ONLY edited acceptance reply; owner-preserved'),
 ('comment','f5a83d36-f203-449a-b079-5136ff8ab2f7','TEST ONLY nested acceptance reply; owner-preserved'),
 ('comment','3043be4d-540d-4a69-a594-7a25dc8119b8','TEST ONLY assigned acceptance response; owner-preserved'),
 ('comment','225f6579-7ae9-44b2-a179-a13ce9e6db65','TEST-DCS-S7-20261112-R1 C13; owner-preserved');
CREATE TABLE studio_private.community_tasks_v1(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN('question','comment','report','editorial')),
 source_id uuid NOT NULL, thread_id uuid NOT NULL, author_id uuid,
 pillar text, tier text CHECK(tier IN('Explore','Create','Collaborate','Develop','Realise')),
 founder boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz, completed_by uuid,
 handler_kind text CHECK(handler_kind='admin'),
 completion_method text CHECK(completion_method IN('manual','reply','report')),
 version bigint NOT NULL DEFAULT 1,
 UNIQUE(kind,source_id),
 CHECK((completed_at IS NULL AND completed_by IS NULL AND handler_kind IS NULL AND completion_method IS NULL)
 OR(completed_at IS NOT NULL AND completed_by IS NOT NULL AND handler_kind IS NOT NULL AND completion_method IS NOT NULL))
);
CREATE INDEX community_tasks_inbox_order_v1 ON studio_private.community_tasks_v1(created_at,id) WHERE completed_at IS NULL;
CREATE INDEX community_tasks_thread_v1 ON studio_private.community_tasks_v1(thread_id);
CREATE TABLE studio_private.community_task_reads_v1(
 task_id uuid NOT NULL REFERENCES studio_private.community_tasks_v1(id),
 admin_id uuid NOT NULL, opened_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(task_id,admin_id)
);
CREATE TABLE studio_private.community_task_events_v1(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES studio_private.community_tasks_v1(id),
 actor_id uuid NOT NULL, action text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 task_version bigint NOT NULL, reply_id uuid
);
CREATE TABLE studio_private.community_task_commands_v1(
 actor_id uuid NOT NULL,key uuid NOT NULL, command jsonb NOT NULL, receipt jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(actor_id,key)
);
ALTER TABLE studio_private.community_task_exclusions_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.community_tasks_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.community_task_reads_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.community_task_events_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_private.community_task_commands_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON studio_private.community_task_exclusions_v1,studio_private.community_tasks_v1,studio_private.community_task_reads_v1,studio_private.community_task_events_v1,studio_private.community_task_commands_v1 FROM PUBLIC,anon,authenticated;

-- No badge inferred from profile text, private admission, phase=intro, or a purchased-looking name.
CREATE FUNCTION studio_private.community_pathway_v1(who uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE pathway text; founding boolean; candidates text[];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=who AND status='active') THEN RETURN '{}'::jsonb;END IF;
 SELECT EXISTS(SELECT 1 FROM studio_private.service_receipts_v1 r WHERE r.key LIKE 'founding:%'
 AND r.actor_id='7e3224e7-b303-4150-a45e-dd9a12efdb68'::uuid
 AND r.result->>'userId'=who::text
 AND r.result ? 'collaborationStarts' AND r.result ? 'platformEnds'
 AND r.result ? 'supportEnds' AND r.result ? 'accessExpires'
 AND r.result->'unchanged'='false'::jsonb) INTO founding;
 IF EXISTS(SELECT 1 FROM studio_private.complimentary_develop_workspace_v1 WHERE user_id=who AND revoked_at IS NULL) THEN
  pathway:='Develop';

 ELSE
  SELECT array_agg(DISTINCT initcap(e->'promise'->>'programme')) INTO candidates
  FROM studio_private.service_ledger_v1 l CROSS JOIN LATERAL jsonb_array_elements(coalesce(l.body->'entries','[]'::jsonb)) e
  WHERE e->>'ownerId'=who::text AND e->'promise'->>'programme' IN('explore','create','collaborate','develop','realise')
  AND e->'promise'->>'start' ~ '^\d{4}-\d{2}-\d{2}$'
  AND e->'promise'->>'createEnds' ~ '^\d{4}-\d{2}-\d{2}$'
  AND e->'promise'->>'start' <= to_char(current_date,'YYYY-MM-DD')
  AND e->'promise'->>'createEnds' > to_char(current_date,'YYYY-MM-DD')
  AND EXISTS(SELECT 1 FROM public.studio_access a WHERE a.user_id=who AND a.revoked_at IS NULL AND a.starts_at<=now() AND a.expires_at>now());
  IF cardinality(candidates)=1 THEN pathway:=candidates[1];END IF;
 END IF;
 RETURN jsonb_build_object('tier',pathway,'founder',founding);
END$$;
REVOKE ALL ON FUNCTION studio_private.community_pathway_v1(uuid) FROM PUBLIC,anon,authenticated;

-- Normalised source projection is private: editorial text is never projected here.
CREATE VIEW studio_private.community_task_sources_v1 AS
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
 SELECT 'report',r.id,p.id,p.author_id,p.studio_chapter,r.created_at,coalesce(c.updated_at,p.updated_at),coalesce(c.status,p.status),
 coalesce(c.status,p.status)='hidden' OR p.status='hidden',r.status='open',r.reason||': '||coalesce(r.notes,''),false,r.reply_id,r.id,r.status
 FROM public.community_reports r LEFT JOIN public.community_replies c ON c.id=r.reply_id
 JOIN public.community_posts p ON p.id=coalesce(r.post_id,c.post_id) JOIN public.community_sections s ON s.id=p.section_id WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 UNION ALL
 SELECT 'editorial',r.id,r.id,r.owner_id,NULL,r.created_at,r.updated_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text FROM public.studio_editorial_requests r
 UNION ALL
 SELECT 'editorial',x.id,r.id,x.author_id,NULL,x.created_at,x.created_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text
 FROM public.studio_editorial_replies x JOIN public.studio_editorial_requests r ON r.id=x.request_id WHERE x.author_id=r.owner_id;
REVOKE ALL ON studio_private.community_task_sources_v1 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION studio_private.community_task_capture_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item record; badge jsonb;
BEGIN
 IF TG_TABLE_NAME='studio_editorial_replies' THEN
 IF EXISTS(SELECT 1 FROM studio_private.editorial_routing_v1 WHERE enabled AND recipient_id=NEW.author_id) THEN
  UPDATE studio_private.community_tasks_v1 SET completed_at=clock_timestamp(),completed_by=NEW.author_id,handler_kind='admin',completion_method='reply',version=version+1 WHERE kind='editorial' AND thread_id=NEW.request_id AND completed_at IS NULL;
  INSERT INTO studio_private.community_task_events_v1(task_id,actor_id,action,task_version,reply_id) SELECT id,NEW.author_id,'reply',version,NEW.id FROM studio_private.community_tasks_v1 WHERE kind='editorial' AND thread_id=NEW.request_id AND completed_at IS NOT NULL AND completion_method='reply' AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_events_v1 e WHERE e.task_id=community_tasks_v1.id AND e.task_version=community_tasks_v1.version);
 END IF;
 END IF;
 FOR item IN SELECT * FROM studio_private.community_task_sources_v1 WHERE source_id=NEW.id LOOP
  IF EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 WHERE kind=item.kind AND source_id=item.source_id) THEN CONTINUE;END IF;
  IF item.kind IN('question','comment') AND EXISTS(SELECT 1 FROM studio_private.editorial_routing_v1 WHERE enabled AND recipient_id=item.author_id) THEN CONTINUE;END IF;
  IF TG_OP='INSERT' THEN
   badge:=studio_private.community_pathway_v1(item.author_id);
   INSERT INTO studio_private.community_tasks_v1(kind,source_id,thread_id,author_id,pillar,tier,founder,created_at)
   VALUES(item.kind,item.source_id,item.thread_id,item.author_id,item.pillar,badge->>'tier',coalesce((badge->>'founder')::boolean,false),item.created_at) ON CONFLICT DO NOTHING;
  ELSE
   UPDATE studio_private.community_tasks_v1 SET version=version+1 WHERE kind=item.kind AND source_id=item.source_id;
  END IF;
 END LOOP;
 IF TG_TABLE_NAME='community_reports' AND TG_OP='UPDATE' THEN
  IF OLD.status='open' AND NEW.status IN('dismissed','actioned') AND NEW.reviewed_by=auth.uid() AND studio_private.dcs_community_staff_v1() THEN
   UPDATE studio_private.community_tasks_v1 SET completed_at=clock_timestamp(),completed_by=NEW.reviewed_by,handler_kind='admin',completion_method='report',version=version+1 WHERE kind='report' AND source_id=NEW.id AND completed_at IS NULL;
   INSERT INTO studio_private.community_task_events_v1(task_id,actor_id,action,task_version) SELECT id,NEW.reviewed_by,'report_'||NEW.status,version FROM studio_private.community_tasks_v1 WHERE kind='report' AND source_id=NEW.id;
  END IF;
 END IF;
 RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION studio_private.community_task_capture_v1() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER dcs_inbox_post_v1 AFTER INSERT OR UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION studio_private.community_task_capture_v1();
CREATE TRIGGER dcs_inbox_reply_v1 AFTER INSERT OR UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION studio_private.community_task_capture_v1();
CREATE TRIGGER dcs_inbox_report_v1 AFTER INSERT OR UPDATE ON public.community_reports FOR EACH ROW EXECUTE FUNCTION studio_private.community_task_capture_v1();
CREATE TRIGGER dcs_inbox_editorial_v1 AFTER INSERT ON public.studio_editorial_requests FOR EACH ROW EXECUTE FUNCTION studio_private.community_task_capture_v1();
CREATE TRIGGER dcs_inbox_editorial_reply_v1 AFTER INSERT ON public.studio_editorial_replies FOR EACH ROW EXECUTE FUNCTION studio_private.community_task_capture_v1();
INSERT INTO studio_private.community_tasks_v1(kind,source_id,thread_id,author_id,pillar,tier,founder,created_at)
SELECT s.kind,s.source_id,s.thread_id,s.author_id,s.pillar,b->>'tier',coalesce((b->>'founder')::boolean,false),s.created_at
FROM studio_private.community_task_sources_v1 s CROSS JOIN LATERAL studio_private.community_pathway_v1(s.author_id) b
WHERE NOT EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 x WHERE x.kind=s.kind AND x.source_id=s.source_id)
AND (s.kind NOT IN('question','comment') OR NOT EXISTS(SELECT 1 FROM studio_private.editorial_routing_v1 r WHERE r.enabled AND r.recipient_id=s.author_id))
AND (s.kind<>'report' OR s.report_status='open');

CREATE FUNCTION public.studio_dcs_inbox_read_v1(p jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; tab text:=coalesce(p->>'tab','inbox'); page integer:=greatest(1,least(100000,coalesce((p->>'page')::integer,1))); total integer; rows jsonb;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 IF tab NOT IN('inbox','done','hidden','log') OR length(p::text)>2000 THEN RAISE EXCEPTION 'Invalid inbox filters';END IF;
 SELECT jsonb_build_object(
 'new',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind IN('question','comment') AND t.completed_at IS NULL AND s.visible AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'mentions',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind IN('question','comment') AND t.completed_at IS NULL AND s.visible AND s.mention AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'reports',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind='report' AND s.report_status='open'),
 'editorial',(SELECT count(*) FROM studio_private.community_tasks_v1 t WHERE t.kind='editorial' AND t.completed_at IS NULL AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid())),
 'outstanding',(SELECT count(*) FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.completed_at IS NULL AND (t.kind='editorial' OR (t.kind='report' AND s.report_status='open') OR (t.kind IN('question','comment') AND s.visible))),
 'pillars',(SELECT coalesce(jsonb_object_agg(pillar,n),'{}'::jsonb) FROM(SELECT t.pillar,count(*) n FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id) WHERE t.kind IN('question','comment') AND t.completed_at IS NULL AND s.visible AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_reads_v1 r WHERE r.task_id=t.id AND r.admin_id=auth.uid()) GROUP BY t.pillar) v)
 ) INTO result;
 IF tab='log' THEN
  SELECT count(*) INTO total FROM public.moderation_actions a JOIN public.community_posts c ON c.id=a.post_id WHERE c.studio_chapter IS NOT NULL;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM(SELECT a.id,a.action,a.reason,a.created_at,a.admin_user_id,coalesce(u.username,'Administrator') handler,a.post_id,a.reply_id,c.studio_chapter pillar FROM public.moderation_actions a JOIN public.community_posts c ON c.id=a.post_id LEFT JOIN public.community_usernames u ON u.user_id=a.admin_user_id WHERE c.studio_chapter IS NOT NULL ORDER BY a.created_at DESC,a.id LIMIT 25 OFFSET (page-1)*25) x;
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
   AND (coalesce(p->>'pillar','')='' OR pillar=p->>'pillar') AND (coalesce(p->>'month','')='' OR to_char(created_at AT TIME ZONE 'UTC','YYYY-MM')=p->>'month')
   AND (coalesce(p->>'type','')='' OR kind=p->>'type') AND (coalesce(p->>'tier','')='' OR tier=p->>'tier')
   AND (coalesce(p->>'handled','')='' OR completed_by::text=p->>'handled')
   AND (coalesce(p->>'q','')='' OR position(lower(p->>'q') IN lower(coalesce(search_body,'')||' '||author))>0)
   AND (coalesce(p->>'focus','')='' OR (p->>'focus'='mentions' AND mention) OR (p->>'focus'='reports' AND kind='report') OR (p->>'focus'='new' AND state='New' AND kind IN('question','comment')))
  ), sliced AS(SELECT * FROM filtered ORDER BY CASE WHEN p->>'sort'='newest' THEN created_at END DESC,CASE WHEN p->>'sort' IS DISTINCT FROM 'newest' THEN created_at END ASC,id LIMIT 25 OFFSET (page-1)*25)
  SELECT (SELECT count(*) FROM filtered),coalesce((SELECT jsonb_agg(to_jsonb(sliced)-'search_body') FROM sliced),'[]') INTO total,rows;
 END IF;
 RETURN jsonb_build_object('version',1,'counters',result,'rows',rows,'total',total,'page',page,'pageSize',25);
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_inbox_read_v1(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_dcs_inbox_read_v1(jsonb) TO authenticated;

CREATE FUNCTION public.studio_dcs_inbox_command_v1(p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();v_key uuid:=(p->>'key')::uuid; act text:=p->>'action'; item jsonb;t studio_private.community_tasks_v1;s record;old studio_private.community_task_commands_v1;receipt jsonb;rid uuid; cmdresult jsonb; n integer:=0;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 IF v_key IS NULL OR act NOT IN('open','done','undo','hide','restore','lock','unlock','dismiss','reply','editorial-open') OR act IS NULL OR length(p::text)>20000 THEN RAISE EXCEPTION 'Invalid task command';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||':'||v_key::text,92));
 SELECT * INTO old FROM studio_private.community_task_commands_v1 WHERE actor_id=actor AND community_task_commands_v1.key=v_key;
 IF FOUND THEN IF old.command IS DISTINCT FROM p THEN RAISE EXCEPTION 'Task retry key conflict';END IF;RETURN old.receipt;END IF;
 IF act='editorial-open' THEN
  INSERT INTO studio_private.community_task_reads_v1(task_id,admin_id) SELECT id,actor FROM studio_private.community_tasks_v1 WHERE kind='editorial' AND thread_id=(p->>'request')::uuid ON CONFLICT DO NOTHING;
 ELSE
  IF jsonb_typeof(p->'items')<>'array' OR jsonb_array_length(p->'items') NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Choose 1 to 25 tasks';END IF;
  IF act IN('reply','undo') AND jsonb_array_length(p->'items')<>1 THEN RAISE EXCEPTION 'One task required';END IF;
  -- Same post-before-task lock order as the accepted member reply RPC; stable ordering for bulk actions.
  PERFORM 1 FROM public.community_posts WHERE id IN(SELECT thread_id FROM studio_private.community_tasks_v1 WHERE id IN(SELECT (x->>'id')::uuid FROM jsonb_array_elements(p->'items') x)) ORDER BY id FOR UPDATE;
  FOR item IN SELECT x FROM jsonb_array_elements(p->'items') x ORDER BY x->>'id' LOOP
   SELECT * INTO t FROM studio_private.community_tasks_v1 WHERE id=(item->>'id')::uuid FOR UPDATE;
   IF t.id IS NULL OR t.kind='editorial' OR t.version IS DISTINCT FROM (item->>'version')::bigint THEN RAISE EXCEPTION 'Task changed; refresh before another action';END IF;
   SELECT * INTO s FROM studio_private.community_task_sources_v1 WHERE kind=t.kind AND source_id=t.source_id;
   IF act='open' THEN
    INSERT INTO studio_private.community_task_reads_v1(task_id,admin_id) VALUES(t.id,actor) ON CONFLICT DO NOTHING;
   ELSIF act='undo' THEN
    IF t.completed_by IS DISTINCT FROM actor OR t.completed_at IS NULL OR t.kind='report' THEN RAISE EXCEPTION 'Task cannot be undone';END IF;
    UPDATE studio_private.community_tasks_v1 SET completed_at=NULL,completed_by=NULL,handler_kind=NULL,completion_method=NULL,version=version+1 WHERE id=t.id;
   ELSIF act IN('done','reply') THEN
    IF t.completed_at IS NOT NULL OR NOT coalesce(s.visible,false) OR t.kind='report' THEN RAISE EXCEPTION 'Task requires explicit report resolution or visible unfinished content';END IF;
    IF act='reply' THEN
     IF (p->>'post')::uuid IS DISTINCT FROM t.thread_id THEN RAISE EXCEPTION 'Task discussion mismatch';END IF;
     IF t.kind='comment' AND (p->>'parent')::uuid IS DISTINCT FROM coalesce((SELECT parent_reply_id FROM public.community_replies WHERE id=t.source_id),t.source_id) THEN RAISE EXCEPTION 'Reply target mismatch';END IF;
     rid:=public.studio_dcs_community_member_reply_v2(t.thread_id,(p->>'parent')::uuid,p->>'body',(p->>'replyKey')::uuid);
    END IF;
    UPDATE studio_private.community_tasks_v1 SET completed_at=clock_timestamp(),completed_by=actor,handler_kind='admin',completion_method=CASE WHEN act='reply' THEN 'reply' ELSE 'manual' END,version=version+1 WHERE id=t.id;
   ELSE
    IF (item->>'expected')::timestamptz IS DISTINCT FROM s.updated_at THEN RAISE EXCEPTION 'Moderation target changed; refresh before acting';END IF;
    IF act='dismiss' AND t.kind<>'report' THEN RAISE EXCEPTION 'A report is required';END IF;
    IF t.kind='report' AND act NOT IN('hide','dismiss') THEN RAISE EXCEPTION 'Explicit report resolution required';END IF;
    cmdresult:=public.studio_dcs_community_moderate_v1(t.thread_id,s.reply_id,act,s.updated_at,p->>'reason',gen_random_uuid(),s.report_id);
    IF t.kind='report' THEN UPDATE studio_private.community_tasks_v1 SET completed_at=clock_timestamp(),completed_by=actor,handler_kind='admin',completion_method='report',version=version+1 WHERE id=t.id AND completed_at IS NULL;END IF;
   END IF;
   INSERT INTO studio_private.community_task_events_v1(task_id,actor_id,action,task_version,reply_id) SELECT id,actor,act,version,rid FROM studio_private.community_tasks_v1 WHERE id=t.id;
   n:=n+1;
  END LOOP;
 END IF;
 receipt:=jsonb_build_object('id',v_key,'saved',true,'count',n,'reply',rid,'action',act,'task',t.id,'taskVersion',(SELECT version FROM studio_private.community_tasks_v1 WHERE id=t.id));
 INSERT INTO studio_private.community_task_commands_v1(actor_id,key,command,receipt) VALUES(actor,v_key,p,receipt);
 RETURN receipt;
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_inbox_command_v1(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_dcs_inbox_command_v1(jsonb) TO authenticated;

CREATE FUNCTION public.studio_dcs_inbox_thread_context_v1(p_task uuid,p_post uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 SELECT jsonb_build_object('id',t.id,'version',t.version,'kind',t.kind,'reply',s.reply_id,'parent',coalesce(r.parent_reply_id,r.id),'completed',t.completed_at IS NOT NULL) INTO result
 FROM studio_private.community_tasks_v1 t JOIN studio_private.community_task_sources_v1 s USING(kind,source_id)
 LEFT JOIN public.community_replies r ON r.id=s.reply_id WHERE t.id=p_task AND t.thread_id=p_post AND t.kind<>'editorial';
 IF result IS NULL THEN RAISE EXCEPTION 'Task discussion mismatch';END IF;RETURN result;
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_inbox_thread_context_v1(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_dcs_inbox_thread_context_v1(uuid,uuid) TO authenticated;

-- Public badges contain no grant, ledger, payment or contact data. Only visible thread authors.
CREATE FUNCTION public.studio_dcs_community_badges_v1(p_post uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM studio_private.community_target_v1(p_post,NULL,false);
 SELECT coalesce(jsonb_object_agg(u.username,studio_private.community_pathway_v1(author_id)),'{}') INTO result FROM(
 SELECT p.author_id FROM public.community_posts p WHERE p.id=p_post
 UNION SELECT r.author_id FROM public.community_replies r WHERE r.post_id=p_post AND r.status='published') authors JOIN public.community_usernames u ON u.user_id=authors.author_id;
 RETURN jsonb_build_object('authors',result,'postUpdatedAt',(SELECT updated_at FROM public.community_posts WHERE id=p_post));
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_community_badges_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.studio_dcs_community_badges_v1(uuid) TO authenticated;
-- Retire the empty private rooms without changing either admission grant.
UPDATE public.community_sections SET is_active=false WHERE key IN('deck-creator-studio','studio-private-qa');
