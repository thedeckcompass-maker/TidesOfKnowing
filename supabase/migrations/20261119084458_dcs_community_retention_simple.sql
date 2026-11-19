-- One daily DCS cleanup, with one small table for keep/release and erasure history.
-- Scheduling is activated separately after the local checks and live dry run.
SET LOCAL lock_timeout='5s';
DO $$BEGIN
 IF to_regprocedure('studio_private.dcs_community_staff_v1()') IS NULL OR md5(pg_get_viewdef('studio_private.community_task_sources_v1'::regclass,true))<>'33688c7383b3df8f35c49dc8d1522651' THEN RAISE EXCEPTION 'Existing Community contract changed';END IF;
END$$;
CREATE TABLE studio_private.community_retention_events_v1(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid NOT NULL,source_id uuid NOT NULL,
 event text NOT NULL CHECK(event IN('keep','release','question_erased','comment_erased','report_erased')),
 happened_at timestamptz NOT NULL DEFAULT clock_timestamp(),actor_id uuid,hidden_since timestamptz
);
CREATE INDEX community_retention_events_thread_v1 ON studio_private.community_retention_events_v1(post_id,happened_at DESC,id DESC);
CREATE UNIQUE INDEX community_retention_erased_once_v1 ON studio_private.community_retention_events_v1(event,source_id) WHERE event LIKE '%_erased';
ALTER TABLE studio_private.community_retention_events_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON studio_private.community_retention_events_v1 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.studio_dcs_retention_kept_v1(p_posts uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 IF cardinality(p_posts)>25 THEN RAISE EXCEPTION 'Choose at most 25 discussions';END IF;
 SELECT coalesce(jsonb_object_agg(p.id::text,jsonb_build_object('kept',coalesce(e.event='keep',false) OR x.preserved,'event',e.id,'preservedTest',x.preserved)),'{}') INTO result
 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id
 LEFT JOIN LATERAL(SELECT id,event FROM studio_private.community_retention_events_v1 e WHERE e.post_id=p.id AND e.event IN('keep','release') ORDER BY happened_at DESC,id DESC LIMIT 1)e ON true
 CROSS JOIN LATERAL(SELECT EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 t WHERE(t.kind='question' AND t.source_id=p.id) OR(t.kind='comment' AND t.source_id IN(SELECT id FROM public.community_replies WHERE post_id=p.id))) preserved)x
 WHERE p.id=ANY(p_posts) AND s.key='studio-general' AND p.studio_chapter IS NOT NULL;
 RETURN result;
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_retention_kept_v1(uuid[]) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.studio_dcs_retention_kept_v1(uuid[]) TO authenticated;

CREATE FUNCTION public.studio_dcs_retention_keep_v1(p_post uuid,p_keep boolean,p_expected uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE last_event uuid;last_state text;newid uuid;
BEGIN
 IF NOT studio_private.dcs_community_staff_v1() THEN RAISE EXCEPTION 'Assigned recipient required';END IF;
 IF p_keep IS NULL THEN RAISE EXCEPTION 'Choose keep or release';END IF;
 PERFORM 1 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE p.id=p_post AND s.key='studio-general' AND p.studio_chapter IS NOT NULL FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Discussion unavailable';END IF;
 SELECT id,event INTO last_event,last_state FROM studio_private.community_retention_events_v1 WHERE post_id=p_post AND event IN('keep','release') ORDER BY happened_at DESC,id DESC LIMIT 1;
 IF last_event IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Protection changed; refresh before another action';END IF;
 IF NOT p_keep AND EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 t WHERE(t.kind='question' AND t.source_id=p_post) OR(t.kind='comment' AND t.source_id IN(SELECT id FROM public.community_replies WHERE post_id=p_post))) THEN RAISE EXCEPTION 'These test records are preserved pending a separate cleanup decision';END IF;
 IF coalesce(last_state='keep',false)=p_keep THEN RETURN jsonb_build_object('saved',true,'kept',p_keep,'event',last_event);END IF;
 INSERT INTO studio_private.community_retention_events_v1(post_id,source_id,event,actor_id) VALUES(p_post,p_post,CASE WHEN p_keep THEN 'keep' ELSE 'release' END,auth.uid()) RETURNING id INTO newid;
 RETURN jsonb_build_object('saved',true,'kept',p_keep,'event',newid);
END$$;
REVOKE ALL ON FUNCTION public.studio_dcs_retention_keep_v1(uuid,boolean,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.studio_dcs_retention_keep_v1(uuid,boolean,uuid) TO authenticated;

-- Existing moderation dates are the source of truth. Unknown dates are never guessed.
CREATE FUNCTION studio_private.community_retention_due_v1()
RETURNS TABLE(kind text,source_id uuid,post_id uuid,hidden_since timestamptz,due_at timestamptz)
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
 WITH roots AS MATERIALIZED(
  SELECT p.id,p.status,p.image_url,
   CASE WHEN p.status='deleted' THEN coalesce(erased.hidden_since,p.deleted_at)
    WHEN p.status='hidden' AND latest.action='hide_post' AND latest.created_at>=p.created_at AND latest.created_at<=now() THEN latest.created_at END hidden_at
  FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id
  LEFT JOIN LATERAL(SELECT action,created_at FROM public.moderation_actions a WHERE a.post_id=p.id AND a.reply_id IS NULL AND a.action IN('hide_post','restore_post') ORDER BY created_at DESC,id DESC LIMIT 1)latest ON true
  LEFT JOIN studio_private.community_retention_events_v1 erased ON erased.event='question_erased' AND erased.source_id=p.id
  WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 ), comments AS MATERIALIZED(
  SELECT r.id,r.post_id,r.status,greatest(p.hidden_at,CASE WHEN r.status='deleted' THEN coalesce(erased.hidden_since,r.deleted_at) WHEN r.status='hidden' AND latest.action='hide_reply' AND latest.created_at>=r.created_at AND latest.created_at<=now() THEN latest.created_at END) hidden_at
  FROM public.community_replies r JOIN roots p ON p.id=r.post_id
  LEFT JOIN LATERAL(SELECT action,created_at FROM public.moderation_actions a WHERE a.reply_id=r.id AND a.action IN('hide_reply','restore_reply') ORDER BY created_at DESC,id DESC LIMIT 1)latest ON true
  LEFT JOIN studio_private.community_retention_events_v1 erased ON erased.event='comment_erased' AND erased.source_id=r.id
 ), reports AS MATERIALIZED(
  SELECT r.id,coalesce(r.post_id,c.post_id) post_id,r.status,r.reviewed_at,r.created_at,
   CASE WHEN r.reply_id IS NULL THEN p.hidden_at ELSE c.hidden_at END hidden_at,
   p.status IN('hidden','deleted') OR coalesce(c.status IN('hidden','deleted'),false) target_hidden
  FROM public.community_reports r LEFT JOIN comments c ON c.id=r.reply_id JOIN roots p ON p.id=coalesce(r.post_id,c.post_id)
 ), report_limits AS(
  SELECT r.post_id,max(r.reviewed_at+interval '24 months') report_until,bool_or(r.status='open' OR r.reviewed_at IS NULL OR r.reviewed_at<r.created_at OR r.reviewed_at>now()) blocked FROM reports r GROUP BY r.post_id
 ), targets AS(
  SELECT 'question'::text kind,p.id source_id,p.id post_id,p.hidden_at,greatest(p.hidden_at+interval '12 months',l.report_until) due_at FROM roots p LEFT JOIN report_limits l ON l.post_id=p.id WHERE p.status IN('hidden','deleted') AND p.hidden_at IS NOT NULL
  UNION ALL
  SELECT 'comment',c.id,c.post_id,c.hidden_at,greatest(c.hidden_at+interval '12 months',l.report_until) FROM comments c LEFT JOIN report_limits l ON l.post_id=c.post_id WHERE c.hidden_at IS NOT NULL
  UNION ALL
  SELECT 'report',r.id,r.post_id,r.hidden_at,greatest(r.reviewed_at+interval '24 months',r.hidden_at+interval '12 months') FROM reports r WHERE r.status<>'open' AND r.reviewed_at>=r.created_at AND r.reviewed_at<=now() AND(NOT r.target_hidden OR r.hidden_at IS NOT NULL)
 )
 SELECT t.kind,t.source_id,t.post_id,t.hidden_at,t.due_at FROM targets t JOIN roots p ON p.id=t.post_id LEFT JOIN report_limits l ON l.post_id=t.post_id
 WHERE t.due_at<=now() AND NOT coalesce(l.blocked,false) AND p.image_url IS NULL
 AND NOT EXISTS(SELECT 1 FROM studio_private.community_retention_events_v1 e WHERE e.source_id=t.source_id AND e.event=t.kind||'_erased')
 AND coalesce((SELECT e.event FROM studio_private.community_retention_events_v1 e WHERE e.post_id=t.post_id AND e.event IN('keep','release') ORDER BY happened_at DESC,id DESC LIMIT 1),'release')<>'keep'
 AND NOT EXISTS(SELECT 1 FROM studio_private.community_task_exclusions_v1 x WHERE(x.kind='question' AND x.source_id=t.post_id) OR(x.kind='comment' AND x.source_id IN(SELECT id FROM public.community_replies WHERE post_id=t.post_id)));
$$;
REVOKE ALL ON FUNCTION studio_private.community_retention_due_v1() FROM PUBLIC,anon,authenticated,service_role;

-- Prevent a new/reopened report from racing a cleanup of the same discussion.
CREATE FUNCTION studio_private.community_retention_report_lock_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE pid uuid;
BEGIN
 pid:=coalesce(NEW.post_id,(SELECT post_id FROM public.community_replies WHERE id=NEW.reply_id));
 IF EXISTS(SELECT 1 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE p.id=pid AND s.key='studio-general' AND p.studio_chapter IS NOT NULL) THEN
  PERFORM 1 FROM public.community_posts WHERE id=pid FOR UPDATE;
  IF NEW.status='open' AND EXISTS(SELECT 1 FROM studio_private.community_retention_events_v1 WHERE(event='question_erased' AND source_id=pid) OR(event='comment_erased' AND source_id=NEW.reply_id) OR(event='report_erased' AND source_id=NEW.id)) THEN RAISE EXCEPTION 'This expired record was erased; create a new report for content still available';END IF;
 END IF;RETURN NEW;
END$$;
REVOKE ALL ON FUNCTION studio_private.community_retention_report_lock_v1() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER dcs_retention_report_lock BEFORE INSERT OR UPDATE OF status ON public.community_reports FOR EACH ROW EXECUTE FUNCTION studio_private.community_retention_report_lock_v1();

CREATE FUNCTION studio_private.community_retention_cleanup_v1() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET lock_timeout='2s' AS $$
DECLARE item record;fresh record;locked uuid;erased integer:=0;task_ids uuid[];old_body text;
BEGIN
 IF NOT pg_try_advisory_xact_lock(hashtextextended('dcs-community-retention-daily',17)) THEN RETURN jsonb_build_object('erased',0,'state','already_running');END IF;
 FOR item IN SELECT * FROM studio_private.community_retention_due_v1() ORDER BY due_at,(kind='question'),source_id LIMIT 100 LOOP
  locked:=NULL;SELECT id INTO locked FROM public.community_posts WHERE id=item.post_id FOR UPDATE SKIP LOCKED;IF locked IS NULL THEN CONTINUE;END IF;
  IF item.kind='comment' THEN locked:=NULL;SELECT id INTO locked FROM public.community_replies WHERE id=item.source_id FOR UPDATE SKIP LOCKED;
  ELSIF item.kind='report' THEN locked:=NULL;SELECT id INTO locked FROM public.community_reports WHERE id=item.source_id FOR UPDATE SKIP LOCKED;END IF;
  IF locked IS NULL THEN CONTINUE;END IF;
  SELECT * INTO fresh FROM studio_private.community_retention_due_v1() WHERE kind=item.kind AND source_id=item.source_id;IF NOT FOUND THEN CONTINUE;END IF;
  IF item.kind='question' AND EXISTS(SELECT 1 FROM public.community_replies r WHERE r.post_id=item.post_id AND NOT EXISTS(SELECT 1 FROM studio_private.community_retention_events_v1 e WHERE e.source_id=r.id AND e.event='comment_erased')) THEN CONTINUE;END IF;
  old_body:=NULL;
  IF item.kind='question' THEN
   SELECT body INTO old_body FROM public.community_posts WHERE id=item.source_id;
   UPDATE public.community_posts SET body='Content removed after retention period',title='Content removed after retention period',slug='retention-removed-'||id::text,studio_selected_text='',studio_project_id=NULL,studio_submission_key=NULL,image_url=NULL,status='deleted',deleted_at=clock_timestamp(),is_pinned=false,pinned_at=NULL,field_note_consideration=false WHERE id=item.source_id;
   DELETE FROM public.notification_events WHERE post_id=item.source_id;
  ELSIF item.kind='comment' THEN
   SELECT body INTO old_body FROM public.community_replies WHERE id=item.source_id;
   UPDATE public.community_replies SET body='Content removed after retention period',studio_submission_key=NULL,status='deleted',deleted_at=clock_timestamp() WHERE id=item.source_id;
   DELETE FROM public.notification_events WHERE reply_id=item.source_id;
  ELSE SELECT notes INTO old_body FROM public.community_reports WHERE id=item.source_id;UPDATE public.community_reports SET notes=NULL WHERE id=item.source_id;END IF;
  SELECT array_agg(id) INTO task_ids FROM studio_private.community_tasks_v1 WHERE kind=item.kind AND source_id=item.source_id;
  UPDATE studio_private.community_task_commands_v1 SET command=(command-'body'-'reason')||jsonb_build_object('retentionRedacted',true) WHERE(item.kind='comment' AND receipt->>'reply'=item.source_id::text) OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(command->'items','[]'))x WHERE(x->>'id')::uuid=ANY(coalesce(task_ids,ARRAY[]::uuid[])));
  UPDATE public.moderation_actions SET reason=CASE WHEN length(coalesce(old_body,''))>0 THEN replace(reason,old_body,'[Content removed under retention policy]') ELSE reason END,before_state=CASE WHEN before_state IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object('status',before_state->'status','updated_at',before_state->'updated_at','retentionRedacted',true)) END,after_state=CASE WHEN after_state IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object('status',after_state->'status','updated_at',after_state->'updated_at','retentionRedacted',true)) END WHERE(item.kind='question' AND post_id=item.source_id AND reply_id IS NULL) OR(item.kind='comment' AND reply_id=item.source_id) OR(item.kind='report' AND report_id=item.source_id);
  INSERT INTO studio_private.community_retention_events_v1(post_id,source_id,event,hidden_since) VALUES(item.post_id,item.source_id,item.kind||'_erased',fresh.hidden_since);erased:=erased+1;
 END LOOP;
 RETURN jsonb_build_object('state','completed','erased',erased,'limit',100);
END$$;
REVOKE ALL ON FUNCTION studio_private.community_retention_cleanup_v1() FROM PUBLIC,anon,authenticated,service_role;

-- Show the existing content-removed label in Done after report details expire.
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
 coalesce(c.status,p.status)='hidden' OR p.status='hidden',r.status='open',CASE WHEN EXISTS(SELECT 1 FROM studio_private.community_retention_events_v1 e WHERE e.event='report_erased' AND e.source_id=r.id) THEN NULL::text ELSE r.reason||': '||coalesce(r.notes,'') END,false,r.reply_id,r.id,r.status
 FROM public.community_reports r LEFT JOIN public.community_replies c ON c.id=r.reply_id
 JOIN public.community_posts p ON p.id=coalesce(r.post_id,c.post_id) JOIN public.community_sections s ON s.id=p.section_id WHERE s.key='studio-general' AND p.studio_chapter IS NOT NULL
 UNION ALL
 SELECT 'editorial',r.id,r.id,r.owner_id,NULL,r.created_at,r.updated_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text FROM public.studio_editorial_requests r
 UNION ALL
 SELECT 'editorial',x.id,r.id,x.author_id,NULL,x.created_at,x.created_at,r.status,false,true,NULL::text,false,NULL::uuid,NULL::uuid,NULL::text
 FROM public.studio_editorial_replies x JOIN public.studio_editorial_requests r ON r.id=x.request_id WHERE x.author_id=r.owner_id;
