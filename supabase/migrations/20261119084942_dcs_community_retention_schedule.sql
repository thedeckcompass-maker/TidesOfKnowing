-- Activate only after the installed function, zero-eligible dry run and UI release are verified.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
DO $$BEGIN
 IF to_regprocedure('studio_private.community_retention_cleanup_v1()') IS NULL THEN RAISE EXCEPTION 'Retention function is not installed';END IF;
 IF EXISTS(SELECT 1 FROM studio_private.community_retention_due_v1()) THEN RAISE EXCEPTION 'Review unexpectedly eligible records before first activation';END IF;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='dcs-community-retention-daily') THEN RAISE EXCEPTION 'Retention schedule already exists';END IF;
END$$;
SELECT cron.schedule('dcs-community-retention-daily','17 3 * * *','SELECT studio_private.community_retention_cleanup_v1();');
