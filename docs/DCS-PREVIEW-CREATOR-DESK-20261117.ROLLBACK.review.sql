-- REVIEW ONLY. Never discard saved inspiration. Before demo/base rollback.
BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM dcs_demo.environment WHERE singleton AND project_ref='utzcmbidotxgmulguzxo') THEN RAISE EXCEPTION 'Preview required';END IF; LOCK TABLE public.studio_creator_inspiration IN ACCESS EXCLUSIVE MODE; IF EXISTS(SELECT 1 FROM public.studio_creator_inspiration) THEN RAISE EXCEPTION 'Preserve saved inspiration; rollback refused'; END IF; END $$;
DROP FUNCTION public.studio_explore_inspiration_link_v1(uuid,uuid);
DROP FUNCTION public.studio_creator_inspiration_save_v1(uuid,text,jsonb);
DROP TABLE public.studio_creator_inspiration;
DROP FUNCTION dcs_demo.inspiration_owner_allowed(boolean);
ROLLBACK;
