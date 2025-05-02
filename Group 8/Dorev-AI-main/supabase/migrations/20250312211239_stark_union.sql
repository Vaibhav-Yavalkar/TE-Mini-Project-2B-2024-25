/*
  # Add Super Admin Role and Initial Setup

  1. Changes
    - Add RLS policies for super admin access
    - Add function to check if user is super admin
    - Add function to promote user to super admin
*/

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'super_admin'::user_role
  );
END;
$$;

-- Create function to promote user to super admin
CREATE OR REPLACE FUNCTION promote_to_super_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can promote users to super admin';
  END IF;

  -- Update the user's profile
  UPDATE public.profiles
  SET 
    role = 'super_admin'::user_role,
    updated_at = now()
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO public.session_logs (
    id,
    user_id,
    action,
    created_at
  ) VALUES (
    gen_random_uuid(),
    target_user_id,
    'promoted_to_super_admin',
    now()
  );
END;
$$;

-- Add RLS policies for super admin access to all tables
CREATE POLICY "Super admins can view all businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all settings"
  ON review_collection_settings
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all settings"
  ON review_collection_settings
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Add indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);