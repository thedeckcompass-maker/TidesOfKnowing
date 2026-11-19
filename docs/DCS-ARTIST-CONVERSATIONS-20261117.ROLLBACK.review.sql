-- REVIEW ONLY. Preserve any new creator/artist history. Never erase it to roll back code.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM studio_private.artist_shortlists_v1) OR EXISTS(SELECT 1 FROM studio_private.artist_introductions_v1) THEN RAISE EXCEPTION 'Conversation history exists; disable the runtime flag and preserve records instead';END IF;END $$;
DROP FUNCTION studio_private.artist_conversation_dispatch_v1(text,jsonb);
DROP FUNCTION studio_private.artist_introduction_view_v1(studio_private.artist_introductions_v1);
DROP TABLE studio_private.artist_introductions_v1,studio_private.artist_shortlists_v1;
ROLLBACK;
