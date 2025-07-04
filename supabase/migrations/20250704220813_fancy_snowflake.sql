/*
  # Franklin Core Features - Micro-Actions and Outcomes System

  1. New Tables
    - `outcomes` - 12-week identity goals with tracking
    - `micro_actions` - Daily actions linked to outcomes and identity
    - `completions` - Action completion tracking with streaks
    - `reflections` - Daily reflection entries
    - `identity_areas` - Core life areas for organization

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Features
    - Identity-based goal setting
    - Daily micro-action tracking
    - Streak calculation and progress analytics
    - Reflection and insights system
*/

-- Identity Areas (Health, Career, Relationships, etc.)
CREATE TABLE IF NOT EXISTS identity_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#6366F1',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 12-Week Outcomes (Identity-based goals)
CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  identity_area_id uuid REFERENCES identity_areas(id),
  title text NOT NULL,
  description text,
  identity_statement text, -- "I am someone who..."
  target_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily Micro-Actions
CREATE TABLE IF NOT EXISTS micro_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outcome_id uuid REFERENCES outcomes(id) ON DELETE CASCADE,
  identity_area_id uuid REFERENCES identity_areas(id),
  title text NOT NULL,
  description text,
  identity_tag text, -- "I am someone who..."
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_minutes integer DEFAULT 5,
  is_template boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Action Completions
CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  micro_action_id uuid REFERENCES micro_actions(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  completion_date date DEFAULT CURRENT_DATE,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  notes text,
  photo_url text,
  location_context text,
  completion_time_minutes integer,
  created_at timestamptz DEFAULT now()
);

-- Daily Reflections
CREATE TABLE IF NOT EXISTS reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reflection_date date DEFAULT CURRENT_DATE,
  type text DEFAULT 'evening' CHECK (type IN ('morning', 'evening', 'weekly')),
  overall_mood integer CHECK (overall_mood >= 1 AND overall_mood <= 5),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  top_win text,
  biggest_challenge text,
  learning text,
  gratitude text,
  tomorrow_intention text,
  identity_progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reflection_date, type)
);

-- Enable RLS
ALTER TABLE identity_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Identity Areas (public read, admin only write)
CREATE POLICY "Anyone can read identity areas"
  ON identity_areas
  FOR SELECT
  TO authenticated
  USING (true);

-- Outcomes
CREATE POLICY "Users can manage their own outcomes"
  ON outcomes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Micro Actions
CREATE POLICY "Users can manage their own micro actions"
  ON micro_actions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completions
CREATE POLICY "Users can manage their own completions"
  ON completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reflections
CREATE POLICY "Users can manage their own reflections"
  ON reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default identity areas
INSERT INTO identity_areas (name, description, icon, color, sort_order) VALUES
('Health & Fitness', 'Physical wellbeing and vitality', 'Heart', '#EF4444', 1),
('Career & Growth', 'Professional development and achievement', 'TrendingUp', '#3B82F6', 2),
('Relationships', 'Connections with family, friends, and community', 'Users', '#EC4899', 3),
('Personal Development', 'Learning, skills, and self-improvement', 'BookOpen', '#8B5CF6', 4),
('Creativity & Hobbies', 'Creative expression and personal interests', 'Palette', '#F59E0B', 5),
('Mindfulness & Spirituality', 'Inner peace and spiritual growth', 'Brain', '#10B981', 6),
('Finance & Security', 'Financial health and security', 'DollarSign', '#059669', 7),
('Environment & Home', 'Living space and environmental impact', 'Home', '#6366F1', 8);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outcomes_user_id ON outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(status);
CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON micro_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_outcome_id ON micro_actions(outcome_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_completions_action_id ON completions(micro_action_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, reflection_date);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_user_streak(user_action_id uuid, user_id_param uuid)
RETURNS integer AS $$
DECLARE
  current_streak integer := 0;
  check_date date := CURRENT_DATE;
BEGIN
  -- Count consecutive days from today backwards
  LOOP
    -- Check if action was completed on check_date
    IF EXISTS (
      SELECT 1 FROM completions 
      WHERE micro_action_id = user_action_id 
      AND user_id = user_id_param 
      AND completion_date = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      -- If we haven't completed today yet, don't break the streak
      IF check_date = CURRENT_DATE THEN
        check_date := check_date - INTERVAL '1 day';
      ELSE
        EXIT; -- Break the loop
      END IF;
    END IF;
    
    -- Safety break after 365 days
    IF current_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate outcome progress
CREATE OR REPLACE FUNCTION calculate_outcome_progress(outcome_id_param uuid)
RETURNS integer AS $$
DECLARE
  total_actions integer;
  total_completions integer;
  days_since_start integer;
  target_days integer := 84; -- 12 weeks
  progress_pct integer;
BEGIN
  -- Count total actions for this outcome
  SELECT COUNT(*) INTO total_actions
  FROM micro_actions 
  WHERE outcome_id = outcome_id_param AND status = 'active';
  
  -- Count total completions for this outcome
  SELECT COUNT(*) INTO total_completions
  FROM completions c
  JOIN micro_actions ma ON c.micro_action_id = ma.id
  WHERE ma.outcome_id = outcome_id_param;
  
  -- If no actions, return 0
  IF total_actions = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate days since outcome creation
  SELECT CURRENT_DATE - (SELECT created_at::date FROM outcomes WHERE id = outcome_id_param)
  INTO days_since_start;
  
  -- Calculate expected completions (total_actions * days_since_start)
  -- Progress = actual_completions / expected_completions * 100
  IF days_since_start > 0 THEN
    progress_pct := LEAST(100, (total_completions * 100) / (total_actions * LEAST(days_since_start, target_days)));
  ELSE
    progress_pct := 0;
  END IF;
  
  RETURN progress_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;