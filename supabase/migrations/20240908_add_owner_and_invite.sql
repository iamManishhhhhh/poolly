-- Migration: add owner_id to funds, create fund_invites, unique constraint on fund_members, and RLS policies
-- This file is safe to run on existing Supabase projects.

-- 1. Ensure owner_id column exists on funds
ALTER TABLE IF EXISTS public.funds
  ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Add foreign key to auth.users (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'funds'
      AND tc.constraint_name = 'funds_owner_id_fkey'
  ) THEN
    ALTER TABLE public.funds
      ADD CONSTRAINT funds_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 2. Create fund_invites table
CREATE TABLE IF NOT EXISTS public.fund_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Ensure unique constraint on fund_members (fund_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'fund_members_fund_id_user_id_key'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.fund_members
      ADD CONSTRAINT fund_members_fund_id_user_id_key UNIQUE (fund_id, user_id);
  END IF;
END$$;

-- 4. Enable Row Level Security on fund_invites and fund_members
ALTER TABLE IF EXISTS public.fund_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fund_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for fund_invites
-- a) Owner can create invites for their own funds
CREATE POLICY "Owners can create invites" ON public.fund_invites
  FOR INSERT TO authenticated
  WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.funds f
    WHERE f.id = fund_id
      AND f.owner_id = auth.uid()
  )
);

-- b) Any authenticated user can read a valid invite (to validate code)
CREATE POLICY "Authenticated can select invites" ON public.fund_invites
  FOR SELECT TO authenticated
  USING (true);

-- 6. RLS policies for fund_members
-- a) Authenticated users can insert a membership only for themselves
CREATE POLICY "Authenticated can join fund" ON public.fund_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- b) Authenticated users can select membership rows (e.g., to list members)
CREATE POLICY "Authenticated can select members" ON public.fund_members
  FOR SELECT TO authenticated
  USING (true);

-- Note: Adjust policy names or conditions as needed for your security model.
