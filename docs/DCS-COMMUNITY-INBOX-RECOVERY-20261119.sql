-- RECOVERY ONLY. Not run during installation. Exact target: vbdqvjvhjleqdadiiqjx.
-- First revert Pages and Worker using the guarded release script's rollback phase.
-- Preserve/export private task tables and events before further investigation.
-- This packet retains all task rows, completion/read history, content, accounts and grants.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$BEGIN
 IF to_regclass('studio_private.community_tasks_v1') IS NULL OR to_regprocedure('public.studio_dcs_inbox_command_v1(jsonb)') IS NULL THEN RAISE EXCEPTION 'Unexpected recovery target';END IF;
 IF EXISTS(SELECT 1 FROM public.community_posts p JOIN public.community_sections s ON s.id=p.section_id WHERE s.key IN('deck-creator-studio','studio-private-qa')) THEN RAISE EXCEPTION 'Private-room state changed; review recovery before continuing';END IF;
END$$;
DROP TRIGGER IF EXISTS dcs_inbox_post_v1 ON public.community_posts;
DROP TRIGGER IF EXISTS dcs_inbox_reply_v1 ON public.community_replies;
DROP TRIGGER IF EXISTS dcs_inbox_report_v1 ON public.community_reports;
DROP TRIGGER IF EXISTS dcs_inbox_editorial_v1 ON public.studio_editorial_requests;
DROP TRIGGER IF EXISTS dcs_inbox_editorial_reply_v1 ON public.studio_editorial_replies;
REVOKE EXECUTE ON FUNCTION public.studio_dcs_inbox_read_v1(jsonb),public.studio_dcs_inbox_command_v1(jsonb),public.studio_dcs_inbox_thread_context_v1(uuid,uuid),public.studio_dcs_community_badges_v1(uuid) FROM authenticated;
UPDATE public.community_sections SET is_active=true WHERE key IN('deck-creator-studio','studio-private-qa');
COMMIT;
-- Read-only verification: retained history and no content/account/grant deletions.
SELECT kind,count(*) tasks,count(completed_at) completed FROM studio_private.community_tasks_v1 GROUP BY kind;
SELECT key,is_active FROM public.community_sections WHERE key IN('studio-general','deck-creator-studio','studio-private-qa');
-- Recovery deliberately does not remove migration history or drop new tables/functions.
-- If triggers are disabled, reconcile new real content before re-enabling the inbox.
