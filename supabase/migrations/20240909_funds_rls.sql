-- Migration: 20240909_funds_rls.sql
-- Adds necessary RLS policies for the public.funds table.

-- 1. INSERT policy: only the owner can create a fund
-- (owner_id must match the authenticated user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funds'
      AND policyname = 'authenticated_insert_fund'
  ) THEN
    CREATE POLICY authenticated_insert_fund
      ON public.funds
      FOR INSERT
      TO authenticated
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;


-- 2. SELECT policy: owners and members can read a fund
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funds'
      AND policyname = 'owner_or_member_select_fund'
  ) THEN
    CREATE POLICY owner_or_member_select_fund
      ON public.funds
      FOR SELECT
      TO authenticated
      USING (
        owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.fund_members fm
          WHERE fm.fund_id = funds.id
            AND fm.user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- 3. UPDATE policy: only the owner can update a fund
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funds'
      AND policyname = 'owner_update_fund'
  ) THEN
    CREATE POLICY owner_update_fund
      ON public.funds
      FOR UPDATE
      TO authenticated
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Policies for contributions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contributions' AND policyname = 'contributions_select') THEN
    CREATE POLICY contributions_select ON public.contributions
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.fund_members fm WHERE fm.fund_id = contributions.fund_id AND fm.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contributions' AND policyname = 'contributions_insert') THEN
    CREATE POLICY contributions_insert ON public.contributions
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.fund_members fm WHERE fm.fund_id = contributions.fund_id AND fm.user_id = auth.uid())
      );
  END IF;
END $$;

-- Policies for expenses table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_select') THEN
    CREATE POLICY expenses_select ON public.expenses
      FOR SELECT TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.fund_members fm WHERE fm.fund_id = expenses.fund_id AND fm.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_insert') THEN
    CREATE POLICY expenses_insert ON public.expenses
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.fund_members fm WHERE fm.fund_id = expenses.fund_id AND fm.user_id = auth.uid())
      );
  END IF;
END $$;