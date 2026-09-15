-- Migration: 20240907_initial_schema.sql
-- Creates base tables required by the Poolly frontend.

-- 1. funds table
CREATE TABLE IF NOT EXISTS public.funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_amount numeric,
  suggested_contribution numeric,
  start_date date NOT NULL,
  end_date date,
  currency text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security for funds
ALTER TABLE IF EXISTS public.funds ENABLE ROW LEVEL SECURITY;

-- 2. fund_members table
CREATE TABLE IF NOT EXISTS public.fund_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  total_contributed numeric DEFAULT 0,
  UNIQUE (fund_id, user_id)
);

-- Enable Row Level Security for fund_members
ALTER TABLE IF EXISTS public.fund_members ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust as needed)
-- Owners can view their funds
CREATE POLICY owner_select_fund ON public.funds
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Members can view funds they belong to
CREATE POLICY member_select_fund ON public.funds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fund_members fm WHERE fm.fund_id = funds.id AND fm.user_id = auth.uid()));

-- Fund members can view their membership rows
CREATE POLICY member_select_own ON public.fund_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fund members can insert their own membership (handled by later migration for unique constraint)
CREATE POLICY member_insert_own ON public.fund_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
