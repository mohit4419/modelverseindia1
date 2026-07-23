-- Migration 012: Ensure models table supports user_id, userId, and userid seamlessly
-- Fixes PostgreSQL error 42703 (column "userid" does not exist) when running unquoted SQL queries like:
-- SELECT id, name, userId, created_at FROM models;

DO $$
BEGIN
    -- 1. Ensure user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'models' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.models ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- 2. Ensure userid column exists (for unquoted userId in Postgres SQL queries)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'models' AND column_name = 'userid'
    ) THEN
        ALTER TABLE public.models ADD COLUMN userid UUID;
    END IF;
END $$;

-- Populate existing rows if null
UPDATE public.models 
SET 
    user_id = COALESCE(user_id, "userId", userid),
    userid = COALESCE(userid, "userId", user_id),
    "userId" = COALESCE("userId", user_id, userid)
WHERE user_id IS NULL OR userid IS NULL OR "userId" IS NULL;

-- Trigger to automatically synchronize user_id, "userId", and userid on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_model_user_ids()
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
BEGIN
    target_id := COALESCE(NEW.user_id, NEW."userId", NEW.userid);
    IF target_id IS NOT NULL THEN
        NEW.user_id := target_id;
        NEW."userId" := target_id;
        NEW.userid := target_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_model_user_ids ON public.models;
CREATE TRIGGER trg_sync_model_user_ids
    BEFORE INSERT OR UPDATE ON public.models
    FOR EACH ROW EXECUTE FUNCTION public.sync_model_user_ids();
