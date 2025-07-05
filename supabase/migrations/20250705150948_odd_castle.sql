/*
  # Add Purpose System and Virtue Metrics Gamification

  1. New Tables
    - `purposes` table for user's main purpose/goal
  
  2. Table Updates
    - Add `purpose_id` column to `outcomes` table
    - Add `xp_awarded` columns to `micro_actions` and `outcomes` tables
    - Add `current_xp`, `level`, and `user_id` columns to `identity_areas` table

  3. Security
    - Enable RLS on `purposes` table
    - Update RLS on `identity_areas` table to be user-specific
    - Add policies for user data access

  4. Functions & Triggers
    - XP award system for identity areas
    - Automatic XP triggers for completions and outcome achievements
*/

-- Create purposes table
CREATE TABLE IF NOT EXISTS purposes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add purpose_id to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outcomes' AND column_name = 'purpose_id'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN purpose_id uuid REFERENCES purposes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add XP columns to micro_actions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'micro_actions' AND column_name = 'xp_awarded'
  ) THEN
    ALTER TABLE micro_actions ADD COLUMN xp_awarded integer DEFAULT 10;
  END IF;
END $$;

-- Add XP columns to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outcomes' AND column_name = 'xp_awarded'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN xp_awarded integer DEFAULT 100;
  END IF;
END $$;

-- Add user_id column to identity_areas table to make it user-specific
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_areas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE identity_areas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add gamification columns to identity_areas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_areas' AND column_name = 'current_xp'
  ) THEN
    ALTER TABLE identity_areas ADD COLUMN current_xp integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_areas' AND column_name = 'level'
  ) THEN
    ALTER TABLE identity_areas ADD COLUMN level integer DEFAULT 0;
  END IF;
END $$;

-- Enable Row Level Security on purposes
ALTER TABLE purposes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for purposes
DROP POLICY IF EXISTS "Users can manage their own purposes" ON purposes;
CREATE POLICY "Users can manage their own purposes"
  ON purposes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update RLS on identity_areas to be user-specific
-- Drop the old policy that allowed anyone to read
DROP POLICY IF EXISTS "Anyone can read identity areas" ON identity_areas;

-- Create new policy for user-specific virtue metrics
DROP POLICY IF EXISTS "Users can manage their own virtue metrics" ON identity_areas;
CREATE POLICY "Users can manage their own virtue metrics"
  ON identity_areas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purposes_user_id ON purposes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_purpose_id ON outcomes(purpose_id);
CREATE INDEX IF NOT EXISTS idx_identity_areas_user_id ON identity_areas(user_id);

-- Function to award XP and level up identity areas
CREATE OR REPLACE FUNCTION award_xp_to_identity_area(
  area_id uuid,
  xp_amount integer
) RETURNS void AS $$
DECLARE
  current_area_xp integer;
  current_area_level integer;
  new_xp integer;
  new_level integer;
BEGIN
  -- Get current XP and level
  SELECT current_xp, level INTO current_area_xp, current_area_level
  FROM identity_areas 
  WHERE id = area_id;
  
  -- Calculate new XP and level
  new_xp := current_area_xp + xp_amount;
  new_level := FLOOR(new_xp / 100); -- Every 100 XP = 1 level
  
  -- Update the identity area
  UPDATE identity_areas 
  SET 
    current_xp = new_xp,
    level = new_level
  WHERE id = area_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle completion XP award
CREATE OR REPLACE FUNCTION handle_completion_xp()
RETURNS TRIGGER AS $$
DECLARE
  action_xp integer;
  action_area_id uuid;
BEGIN
  -- Get the micro action's XP and identity area
  SELECT xp_awarded, identity_area_id INTO action_xp, action_area_id
  FROM micro_actions 
  WHERE id = NEW.micro_action_id;
  
  -- Award XP if there's an identity area
  IF action_area_id IS NOT NULL THEN
    PERFORM award_xp_to_identity_area(action_area_id, action_xp);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for completion XP
DROP TRIGGER IF EXISTS trigger_completion_xp ON completions;
CREATE TRIGGER trigger_completion_xp
  AFTER INSERT ON completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_completion_xp();

-- Function to handle outcome completion XP award
CREATE OR REPLACE FUNCTION handle_outcome_completion_xp()
RETURNS TRIGGER AS $$
DECLARE
  outcome_xp integer;
  outcome_area_id uuid;
BEGIN
  -- Only award XP when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get the outcome's XP and identity area
    SELECT xp_awarded, identity_area_id INTO outcome_xp, outcome_area_id
    FROM outcomes 
    WHERE id = NEW.id;
    
    -- Award XP if there's an identity area
    IF outcome_area_id IS NOT NULL THEN
      PERFORM award_xp_to_identity_area(outcome_area_id, outcome_xp);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for outcome completion XP
DROP TRIGGER IF EXISTS trigger_outcome_completion_xp ON outcomes;
CREATE TRIGGER trigger_outcome_completion_xp
  AFTER UPDATE ON outcomes
  FOR EACH ROW
  EXECUTE FUNCTION handle_outcome_completion_xp();