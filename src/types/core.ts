export interface IdentityArea {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Outcome {
  id: string;
  user_id: string;
  identity_area_id?: string;
  title: string;
  description?: string;
  identity_statement?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  identity_area?: IdentityArea;
}

export interface MicroAction {
  id: string;
  user_id: string;
  outcome_id?: string;
  identity_area_id?: string;
  title: string;
  description?: string;
  identity_tag?: string;
  difficulty_level: number;
  estimated_minutes: number;
  is_template: boolean;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  outcome?: Outcome;
  identity_area?: IdentityArea;
  current_streak?: number;
  completed_today?: boolean;
  total_completions?: number;
}

export interface Completion {
  id: string;
  user_id: string;
  micro_action_id: string;
  completed_at: string;
  completion_date: string;
  mood_rating?: number;
  energy_level?: number;
  notes?: string;
  photo_url?: string;
  location_context?: string;
  completion_time_minutes?: number;
  created_at: string;
  micro_action?: MicroAction;
}

export interface Reflection {
  id: string;
  user_id: string;
  reflection_date: string;
  type: 'morning' | 'evening' | 'weekly';
  overall_mood?: number;
  energy_level?: number;
  top_win?: string;
  biggest_challenge?: string;
  learning?: string;
  gratitude?: string;
  tomorrow_intention?: string;
  identity_progress_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  total_actions: number;
  completed_actions: number;
  completion_rate: number;
  current_streaks: number;
  longest_streak: number;
  total_minutes_estimated: number;
  total_minutes_completed: number;
}