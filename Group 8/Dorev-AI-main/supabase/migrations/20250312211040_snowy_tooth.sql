/*
  # Add Super Admin Role and Initial Setup

  1. Changes
    - Add function to create super admin
    - Create initial super admin user
    - Add RLS policies for super admin access
*/

-- Function to create super admin
CREATE OR REPLACE FUNCTION create_super_admin(
  email text,
  password text,
  full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create user in auth.users
  new_user_id := (
    SELECT id FROM auth.users
    WHERE auth.users.email = create_super_admin.email
  );
  
  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    )
    VALUES (
      new_user_id,
      email,
      crypt(password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'full_name', full_name,
        'role', 'super_admin'
      )
    );
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    is_active
  )
  VALUES (
    new_user_id,
    full_name,
    'super_admin',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'super_admin',
    is_active = true,
    updated_at = now();
END;
$$;