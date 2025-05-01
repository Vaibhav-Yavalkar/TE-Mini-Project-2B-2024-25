-- Enable inserts to profiles table during registration
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Enable updates to profiles table
CREATE POLICY "Enable update for users based on id"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Enable inserts to businesses table for authenticated users
CREATE POLICY "Enable insert for authenticated users"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policy for linking business to profile
CREATE POLICY "Users can update their own profile with business_id"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id); 