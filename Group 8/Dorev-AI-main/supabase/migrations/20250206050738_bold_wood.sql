/*
  # Reviews Schema Setup

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `rating` (integer, 1-5)
      - `content` (text)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `date` (date)
      - `sentiment` (enum: positive, neutral, negative)
      - `is_public` (boolean)
      - `business_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `resolved` (boolean)
      - `response` (text)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for business owners to manage their reviews
*/

-- Create enum type for sentiment
CREATE TYPE review_sentiment AS ENUM ('positive', 'neutral', 'negative');

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sentiment review_sentiment NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  business_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  response text
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business owners can view their reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Business owners can insert reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Business owners can update their reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Business owners can delete their reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (business_id = auth.uid());

-- Create indexes
CREATE INDEX reviews_business_id_idx ON reviews(business_id);
CREATE INDEX reviews_date_idx ON reviews(date);
CREATE INDEX reviews_sentiment_idx ON reviews(sentiment);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();