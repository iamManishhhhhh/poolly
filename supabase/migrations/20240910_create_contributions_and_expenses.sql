-- Migration: 20240910_create_contributions_and_expenses.sql
-- Creates contributions and expenses tables with appropriate columns and foreign keys.

-- 1. contributions table
CREATE TABLE IF NOT EXISTS public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  contributor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('pending','completed')),
  note text
);

-- Enable Row Level Security for contributions
ALTER TABLE IF EXISTS public.contributions ENABLE ROW LEVEL SECURITY;

-- 2. expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  added_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  vendor text,
  category text,
  date timestamp with time zone NOT NULL DEFAULT now(),
  receipt_url text,
  status text NOT NULL CHECK (status IN ('pending','approved','rejected'))
);

-- Enable Row Level Security for expenses
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
