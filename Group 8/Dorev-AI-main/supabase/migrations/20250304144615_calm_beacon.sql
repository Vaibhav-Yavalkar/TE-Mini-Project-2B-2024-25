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

-- Enable RLS
ALTER TABLE review_collection_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business owners can view their settings"
  ON review_collection_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can insert settings"
  ON review_collection_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Business owners can update settings"
  ON review_collection_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON review_collection_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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