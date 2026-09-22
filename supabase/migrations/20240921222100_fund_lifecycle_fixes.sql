-- Migration: 20240921222100_fund_lifecycle_fixes.sql
-- Adds trigger for automatic fund owner membership and necessary DELETE RLS policies.

-- 1. Function that automatically creates the owner’s membership
CREATE OR REPLACE FUNCTION public.handle_new_fund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.fund_members (fund_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin');
  RETURN NEW;
END;
$$;

-- Restrict execution rights
REVOKE ALL ON FUNCTION public.handle_new_fund() FROM PUBLIC;

-- 2. Trigger that fires after a fund is inserted
CREATE TRIGGER on_fund_created
  AFTER INSERT ON public.funds
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_fund();

-- 3. Funds DELETE Policy
CREATE POLICY owner_delete_fund
  ON public.funds
  FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = owner_id
  );

-- 4. Fund Members DELETE Policy
CREATE POLICY member_delete_own
  ON public.fund_members
  FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND role <> 'admin'
  );
