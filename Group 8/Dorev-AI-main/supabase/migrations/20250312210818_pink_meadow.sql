/*
  # Add Authentication Trigger

  This migration adds a trigger to automatically create a profile
  when a new user signs up through Supabase Auth.

  1. Functions
    - Create handle_new_user() function to create profile
    - Create update_last_login() function to track login activity
  
  2. Triggers
    - Add trigger for new user creation
    - Add trigger for user login tracking
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'staff',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = NEW.id;
  
  INSERT INTO public.session_logs (
    id,
    user_id,
    business_id,
    action,
    ip_address,
    user_agent
  )
  SELECT
    gen_random_uuid(),
    NEW.id,
    profiles.business_id,
    'login',
    NEW.ip_address,
    NEW.raw_user_meta_data->>'user_agent'
  FROM public.profiles
  WHERE profiles.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger for user login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();