/*
  # Purpose and Gamification Implementation

  1. New Tables
    - `purposes` - Store user's overarching life purpose
    
  2. Schema Updates
    - Add `purpose_id` to outcomes table
    - Add `xp_awarded` columns to micro_actions and outcomes 
    - Add `current_xp` and `level` to identity_areas for gamification
    
  3. Security
    - Enable RLS on purposes table
    - Add policies for user data access
*/

-- Create purposes table
CREATE TABLE IF NOT EXISTS purposes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    ALTER TABLE outcomes ADD COLUMN purpose_id uuid REFERENCES purposes(id);
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purposes_user_id ON purposes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_purpose_id ON outcomes(purpose_id);

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