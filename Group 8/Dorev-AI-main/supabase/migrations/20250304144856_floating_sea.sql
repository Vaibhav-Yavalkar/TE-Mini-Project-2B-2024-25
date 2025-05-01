/*
  # Create review collection settings table

  1. New Tables
    - `review_collection_settings`
      - `id` (integer, primary key)
      - `business_name` (text)
      - `google_place_id` (text)
      - `discount_code` (text)
      - `discount_amount` (text)
      - `discount_type` (text)
      - `primary_color` (text)
      - `logo_url` (text)
      - `redirect_to_google` (boolean)
      - `send_email_coupon` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `review_collection_settings` table
    - Add policy for authenticated users to manage their settings
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_collection_settings (
  id integer PRIMARY KEY,
  business_name text,
  google_place_id text,
  discount_code text,
  discount_amount text,
  discount_type text,
  primary_color text,
  logo_url text,
  redirect_to_google boolean DEFAULT true,
  send_email_coupon boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'review_collection_settings' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE review_collection_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_collection_settings' 
    AND policyname = 'Business owners can view their settings'
  ) THEN
    CREATE POLICY "Business owners can view their settings"
      ON review_collection_settings
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_collection_settings' 
    AND policyname = 'Business owners can insert settings'
  ) THEN
    CREATE POLICY "Business owners can insert settings"
      ON review_collection_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_collection_settings' 
    AND policyname = 'Business owners can update settings'
  ) THEN
    CREATE POLICY "Business owners can update settings"
      ON review_collection_settings
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create or replace function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_settings_updated_at
      BEFORE UPDATE ON review_collection_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add coupon_code column to reviews table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE reviews ADD COLUMN coupon_code text;
  END IF;
END $$;