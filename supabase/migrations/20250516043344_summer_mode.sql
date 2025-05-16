/*
  # Create content tables for streaming and comics

  1. New Tables
    - streaming_content
      - id (uuid, primary key)
      - title (text)
      - type (text)
      - description (text)
      - genres (text[])
      - thumbnail (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - comics_content
      - id (uuid, primary key)
      - title (text)
      - type (text)
      - author (text)
      - description (text)
      - genres (text[])
      - cover (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create streaming_content table
CREATE TABLE IF NOT EXISTS streaming_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  description text,
  genres text[] DEFAULT '{}',
  thumbnail text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comics_content table
CREATE TABLE IF NOT EXISTS comics_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  author text,
  description text,
  genres text[] DEFAULT '{}',
  cover text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE streaming_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE comics_content ENABLE ROW LEVEL SECURITY;

-- Create policies for streaming_content
CREATE POLICY "Allow public read access to streaming content"
  ON streaming_content
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create streaming content"
  ON streaming_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their streaming content"
  ON streaming_content
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM user_content_permissions
    WHERE content_id = id AND content_type = 'stream'
  ));

-- Create policies for comics_content
CREATE POLICY "Allow public read access to comics content"
  ON comics_content
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create comics content"
  ON comics_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their comics content"
  ON comics_content
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM user_content_permissions
    WHERE content_id = id AND content_type = 'comic'
  ));

-- Create permissions table for content management
CREATE TABLE IF NOT EXISTS user_content_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

ALTER TABLE user_content_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_content_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);