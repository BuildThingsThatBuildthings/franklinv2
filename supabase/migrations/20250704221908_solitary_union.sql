-- Create identity_areas table
CREATE TABLE IF NOT EXISTS identity_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#6366F1',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create outcomes table  
CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identity_area_id uuid REFERENCES identity_areas(id),
  title text NOT NULL,
  description text,
  identity_statement text,
  target_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create micro_actions table
CREATE TABLE IF NOT EXISTS micro_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outcome_id uuid REFERENCES outcomes(id) ON DELETE CASCADE,
  identity_area_id uuid REFERENCES identity_areas(id),
  title text NOT NULL,
  description text,
  identity_tag text,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_minutes integer DEFAULT 5,
  is_template boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create completions table
CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  micro_action_id uuid NOT NULL REFERENCES micro_actions(id) ON DELETE CASCADE,
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

-- Create reflections table
CREATE TABLE IF NOT EXISTS reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to reflections if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'reflections' 
    AND constraint_name = 'reflections_user_id_reflection_date_type_key'
  ) THEN
    ALTER TABLE reflections ADD CONSTRAINT reflections_user_id_reflection_date_type_key 
    UNIQUE(user_id, reflection_date, type);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE identity_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (drop and recreate to avoid conflicts)

-- Identity Areas: Public read access
DROP POLICY IF EXISTS "Anyone can read identity areas" ON identity_areas;
CREATE POLICY "Anyone can read identity areas"
  ON identity_areas
  FOR SELECT
  TO authenticated
  USING (true);

-- Outcomes: Users can manage their own outcomes
DROP POLICY IF EXISTS "Users can manage their own outcomes" ON outcomes;
CREATE POLICY "Users can manage their own outcomes"
  ON outcomes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Micro Actions: Users can manage their own micro actions
DROP POLICY IF EXISTS "Users can manage their own micro actions" ON micro_actions;
CREATE POLICY "Users can manage their own micro actions"
  ON micro_actions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completions: Users can manage their own completions
DROP POLICY IF EXISTS "Users can manage their own completions" ON completions;
CREATE POLICY "Users can manage their own completions"
  ON completions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reflections: Users can manage their own reflections
DROP POLICY IF EXISTS "Users can manage their own reflections" ON reflections;
CREATE POLICY "Users can manage their own reflections"
  ON reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create Indexes for Performance

-- Outcomes indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_user_id ON outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(status);

-- Micro Actions indexes
CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON micro_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_outcome_id ON micro_actions(outcome_id);

-- Completions indexes
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_action_id ON completions(micro_action_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completion_date);

-- Reflections indexes
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, reflection_date);

-- Insert default identity areas (only if table is empty)
INSERT INTO identity_areas (name, description, color, sort_order) 
SELECT * FROM (VALUES
  ('Health & Fitness', 'Physical and mental wellbeing', '#10B981', 1),
  ('Career & Growth', 'Professional development and learning', '#3B82F6', 2),
  ('Relationships', 'Family, friends, and social connections', '#F59E0B', 3),
  ('Personal Growth', 'Self-improvement and mindfulness', '#8B5CF6', 4),
  ('Creativity & Hobbies', 'Creative pursuits and personal interests', '#EF4444', 5),
  ('Finance & Security', 'Financial planning and stability', '#059669', 6)
) AS new_areas(name, description, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM identity_areas LIMIT 1);

-- Create function to calculate user streaks
CREATE OR REPLACE FUNCTION get_user_streak(user_action_id uuid, user_id_param uuid)
RETURNS integer AS $$
DECLARE
  streak_count integer := 0;
  current_date_check date := CURRENT_DATE;
  has_completion boolean;
BEGIN
  -- Start from today and work backwards
  LOOP
    -- Check if there's a completion for this date
    SELECT EXISTS(
      SELECT 1 FROM completions 
      WHERE micro_action_id = user_action_id 
      AND user_id = user_id_param 
      AND completion_date = current_date_check
    ) INTO has_completion;
    
    -- If no completion found, break the streak
    IF NOT has_completion THEN
      EXIT;
    END IF;
    
    -- Increment streak and go to previous day
    streak_count := streak_count + 1;
    current_date_check := current_date_check - INTERVAL '1 day';
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing views (recreate them to ensure they work with new schema)
DROP VIEW IF EXISTS stripe_user_subscriptions;
CREATE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.deleted_at IS NULL AND ss.deleted_at IS NULL;

DROP VIEW IF EXISTS stripe_user_orders;
CREATE VIEW stripe_user_orders AS
SELECT 
  sc.customer_id,
  so.id as order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status as order_status,
  so.created_at as order_date
FROM stripe_customers sc
LEFT JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.deleted_at IS NULL AND so.deleted_at IS NULL;