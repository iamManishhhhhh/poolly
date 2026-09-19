-- Migration: 20240914_join_fund_by_code.sql
-- Adds the join_fund_by_code RPC used by the frontend.
-- The function accepts a join code, verifies that the invite exists and is not expired,
-- inserts the authenticated user as a member (if not already), and returns the fund UUID.
-- It runs with the caller's privileges (SECURITY INVOKER) because the existing RLS policies
-- already allow the required reads/inserts for authenticated users.

SET check_function_bodies = false; -- allow creation without full body check for safety

CREATE OR REPLACE FUNCTION public.join_fund_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_invite record;
    v_user_id uuid := auth.uid();
    v_fund_id uuid;
BEGIN
    -- Find a valid (non‑expired) invite matching the supplied code
    SELECT * INTO v_invite
    FROM public.fund_invites
    WHERE code = p_code
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite code' USING ERRCODE = 'P0001';
    END IF;

    v_fund_id := v_invite.fund_id;

    -- Insert the membership; rely on the unique (fund_id, user_id) constraint to avoid duplicates
    INSERT INTO public.fund_members (fund_id, user_id, role)
    VALUES (v_fund_id, v_user_id, 'member')
    ON CONFLICT (fund_id, user_id) DO NOTHING;

    RETURN v_fund_id;
END;
$$;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION public.join_fund_by_code(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.join_fund_by_code(text) FROM anon;

-- Clean up session settings
RESET check_function_bodies;
