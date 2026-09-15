-- Migration: 20240912_fix_funds_select_rls.sql
-- Consolidated SELECT policy for public.funds to allow owners, members, and invite holders to view fund metadata.

ALTER TABLE IF EXISTS public.funds ENABLE ROW LEVEL SECURITY;

-- Drop legacy/duplicate select policies on public.funds
DROP POLICY IF EXISTS owner_select_fund ON public.funds;
DROP POLICY IF EXISTS member_select_fund ON public.funds;
DROP POLICY IF EXISTS owner_or_member_select_fund ON public.funds;
DROP POLICY IF EXISTS funds_select_policy ON public.funds;

-- Create consolidated SELECT policy
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
    )
  );
