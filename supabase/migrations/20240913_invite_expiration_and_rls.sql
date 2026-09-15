-- Migration: 20240913_invite_expiration_and_rls.sql
-- Adds expires_at to fund_invites. Tightens RLS so expired invites are rejected
-- at the database level, not just in the frontend.

-- ============================================================================
-- 1. Add expires_at column to fund_invites (nullable for backward compat)
-- ============================================================================
ALTER TABLE public.fund_invites
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- ============================================================================
-- 2. Tighten fund_members INSERT policy
--    User can only join if:
--    a) they are inserting their own user_id
--    b) a valid, non-expired fund_invite exists for that fund
-- ============================================================================
-- Drop ALL existing INSERT policies on fund_members to avoid conflicts
DROP POLICY IF EXISTS "Authenticated can join fund" ON public.fund_members;
DROP POLICY IF EXISTS "member_insert_own" ON public.fund_members;

CREATE POLICY "Authenticated can join fund via valid invite" ON public.fund_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.fund_invites fi
      WHERE fi.fund_id = fund_members.fund_id
        AND (fi.expires_at IS NULL OR fi.expires_at > now())
    )
  );

-- ============================================================================
-- 3. Tighten funds SELECT policy for invite holders
--    Only allow previewing a fund via invite if the invite is still valid.
--    Owners and existing members keep unconditional access.
-- ============================================================================
DROP POLICY IF EXISTS funds_select_policy ON public.funds;
DROP POLICY IF EXISTS owner_select_fund ON public.funds;
DROP POLICY IF EXISTS member_select_fund ON public.funds;
DROP POLICY IF EXISTS owner_or_member_select_fund ON public.funds;

CREATE POLICY funds_select_policy ON public.funds
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.fund_members fm
      WHERE fm.fund_id = funds.id AND fm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.fund_invites fi
      WHERE fi.fund_id = funds.id
        AND (fi.expires_at IS NULL OR fi.expires_at > now())
    )
  );

-- ============================================================================
-- 4. Update fund_invites INSERT policy to include expires_at
--    (The owner must still own the fund to create invites)
-- ============================================================================
DROP POLICY IF EXISTS "Owners can create invites" ON public.fund_invites;

CREATE POLICY "Owners can create invites" ON public.fund_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = fund_id
        AND f.owner_id = auth.uid()
    )
  );
