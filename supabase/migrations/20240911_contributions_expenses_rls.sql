-- Migration: 20240911_contributions_expenses_rls.sql
-- Enables RLS and creates secure access policies for contributions and expenses tables.

-- Ensure Row Level Security is enabled
ALTER TABLE IF EXISTS public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

-- 1. CONTRIBUTIONS POLICIES

-- Drop existing policies if any
DROP POLICY IF EXISTS contributions_select ON public.contributions;
DROP POLICY IF EXISTS contributions_insert ON public.contributions;
DROP POLICY IF EXISTS contributions_select_policy ON public.contributions;
DROP POLICY IF EXISTS contributions_insert_policy ON public.contributions;
DROP POLICY IF EXISTS contributions_update_policy ON public.contributions;
DROP POLICY IF EXISTS contributions_delete_policy ON public.contributions;

-- Select: Fund owners and fund members can view contributions belonging to their funds
CREATE POLICY contributions_select_policy ON public.contributions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = contributions.fund_id
        AND (
          f.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.fund_members fm
            WHERE fm.fund_id = f.id AND fm.user_id = auth.uid()
          )
        )
    )
  );

-- Insert: Fund owners and members can add contributions for themselves
CREATE POLICY contributions_insert_policy ON public.contributions
  FOR INSERT TO authenticated
  WITH CHECK (
    contributor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = contributions.fund_id
        AND (
          f.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.fund_members fm
            WHERE fm.fund_id = f.id AND fm.user_id = auth.uid()
          )
        )
    )
  );

-- Update: Contributor or fund owner can update
CREATE POLICY contributions_update_policy ON public.contributions
  FOR UPDATE TO authenticated
  USING (
    contributor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = contributions.fund_id AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    contributor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = contributions.fund_id AND f.owner_id = auth.uid()
    )
  );

-- Delete: Contributor or fund owner can delete
CREATE POLICY contributions_delete_policy ON public.contributions
  FOR DELETE TO authenticated
  USING (
    contributor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = contributions.fund_id AND f.owner_id = auth.uid()
    )
  );

-- 2. EXPENSES POLICIES

-- Drop existing policies if any
DROP POLICY IF EXISTS expenses_select ON public.expenses;
DROP POLICY IF EXISTS expenses_insert ON public.expenses;
DROP POLICY IF EXISTS expenses_select_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_insert_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_update_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_delete_policy ON public.expenses;

-- Select: Fund owners and members can view expenses belonging to their funds
CREATE POLICY expenses_select_policy ON public.expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = expenses.fund_id
        AND (
          f.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.fund_members fm
            WHERE fm.fund_id = f.id AND fm.user_id = auth.uid()
          )
        )
    )
  );

-- Insert: Fund owners and members can create expenses added by themselves
CREATE POLICY expenses_insert_policy ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    added_by_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = expenses.fund_id
        AND (
          f.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.fund_members fm
            WHERE fm.fund_id = f.id AND fm.user_id = auth.uid()
          )
        )
    )
  );

-- Update: Creator or fund owner can update expense
CREATE POLICY expenses_update_policy ON public.expenses
  FOR UPDATE TO authenticated
  USING (
    added_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = expenses.fund_id AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    added_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = expenses.fund_id AND f.owner_id = auth.uid()
    )
  );

-- Delete: Creator or fund owner can delete expense
CREATE POLICY expenses_delete_policy ON public.expenses
  FOR DELETE TO authenticated
  USING (
    added_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.funds f
      WHERE f.id = expenses.fund_id AND f.owner_id = auth.uid()
    )
  );
