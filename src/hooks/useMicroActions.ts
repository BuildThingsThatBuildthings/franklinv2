import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MicroAction, Completion, DailyStats } from '@/src/types/core';

export function useMicroActions() {
  const { user, isConfigured } = useAuth();
  const [actions, setActions] = useState<MicroAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchMicroActions();
    fetchDailyStats();
  }, [user, isConfigured]);

  const fetchMicroActions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('micro_actions')
        .select(`
          *,
          outcome:outcomes(*),
          identity_area:identity_areas(*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Enhance actions with completion data
      const enhancedActions = await Promise.all(
        (data || []).map(async (action) => {
          // Check if completed today
          const { data: todayCompletion } = await supabase
            .from('completions')
            .select('id')
            .eq('micro_action_id', action.id)
            .eq('completion_date', new Date().toISOString().split('T')[0])
            .maybeSingle();

          // Get total completions count
          const { count: totalCompletions } = await supabase
            .from('completions')
            .select('*', { count: 'exact', head: true })
            .eq('micro_action_id', action.id);

          // Get current streak (we'll call the database function)
          const { data: streakData } = await supabase.rpc('get_user_streak', {
            user_action_id: action.id,
            user_id_param: user?.id
          });

          return {
            ...action,
            completed_today: !!todayCompletion,
            total_completions: totalCompletions || 0,
            current_streak: streakData || 0,
          };
        })
      );

      setActions(enhancedActions);
    } catch (err: any) {
      console.error('Error fetching micro actions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's actions
      const { data: todayActions } = await supabase
        .from('micro_actions')
        .select('id, estimated_minutes')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Get today's completions
      const { data: todayCompletions } = await supabase
        .from('completions')
        .select('micro_action_id, completion_time_minutes')
        .eq('user_id', user?.id)
        .eq('completion_date', today);

      const totalActions = todayActions?.length || 0;
      const completedActions = todayCompletions?.length || 0;
      const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
      
      const totalMinutesEstimated = todayActions?.reduce((sum, action) => sum + action.estimated_minutes, 0) || 0;
      const totalMinutesCompleted = todayCompletions?.reduce((sum, completion) => 
        sum + (completion.completion_time_minutes || 0), 0) || 0;

      setDailyStats({
        total_actions: totalActions,
        completed_actions: completedActions,
        completion_rate: Math.round(completionRate),
        current_streaks: 0, // Will calculate from actions
        longest_streak: 0, // Will calculate from actions
        total_minutes_estimated: totalMinutesEstimated,
        total_minutes_completed: totalMinutesCompleted,
      });
    } catch (err) {
      console.error('Error fetching daily stats:', err);
    }
  };

  const createMicroAction = async (actionData: Partial<MicroAction>) => {
    try {
      const { data, error } = await supabase
        .from('micro_actions')
        .insert({
          ...actionData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMicroActions();
      await fetchDailyStats();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const completeAction = async (actionId: string, completionData?: Partial<Completion>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already completed today
      const { data: existingCompletion } = await supabase
        .from('completions')
        .select('id')
        .eq('micro_action_id', actionId)
        .eq('completion_date', today)
        .maybeSingle();

      if (existingCompletion) {
        throw new Error('Action already completed today');
      }

      const { data, error } = await supabase
        .from('completions')
        .insert({
          micro_action_id: actionId,
          user_id: user?.id,
          completion_date: today,
          ...completionData,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchMicroActions();
      await fetchDailyStats();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const uncompleteAction = async (actionId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('micro_action_id', actionId)
        .eq('user_id', user?.id)
        .eq('completion_date', today);

      if (error) throw error;

      await fetchMicroActions();
      await fetchDailyStats();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const deleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('micro_actions')
        .update({ status: 'archived' })
        .eq('id', actionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchMicroActions();
      await fetchDailyStats();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    actions,
    loading,
    error,
    dailyStats,
    createMicroAction,
    completeAction,
    uncompleteAction,
    deleteAction,
    refetch: fetchMicroActions,
  };
}