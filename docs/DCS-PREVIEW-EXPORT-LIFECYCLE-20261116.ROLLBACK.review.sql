-- Step 2 rollback precedes rollback of demo compatibility. Review only.
BEGIN;
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM dcs_demo.imports) OR EXISTS(SELECT 1 FROM dcs_demo.grants WHERE isolated_history_verified)
 THEN RAISE EXCEPTION 'Preserve populated demonstration export/lifecycle contracts';END IF;
END$$;
DROP TRIGGER dcs_demo_lifecycle ON public.studio_projects;
DROP TRIGGER dcs_demo_lifecycle ON public.studio_cards;
DROP FUNCTION dcs_demo.lifecycle_guard();
DROP FUNCTION public.studio_project_export_snapshot_v1(uuid),public.studio_editorial_owner_history_v1(uuid),public.studio_exchange_export_snapshot_v1(uuid);
DROP FUNCTION public.studio_capture_atomic_v1(uuid,timestamptz,jsonb,jsonb),public.studio_remove_deleted_project_card_v1(uuid,uuid);
DROP FUNCTION dcs_demo.require_export(uuid);
ALTER TABLE dcs_demo.grants DROP COLUMN isolated_history_verified;
ROLLBACK;
