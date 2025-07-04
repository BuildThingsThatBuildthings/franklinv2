import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Outcome } from '@/src/types/core';

export function useOutcomes() {
  const { user, isConfigured } = useAuth();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchOutcomes();
  }, [user, isConfigured]);

  const fetchOutcomes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('outcomes')
        .select(`
          *,
          identity_area:identity_areas(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOutcomes(data || []);
    } catch (err: any) {
      console.error('Error fetching outcomes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOutcome = async (outcomeData: Partial<Outcome>) => {
    try {
      const { data, error } = await supabase
        .from('outcomes')
        .insert({
          ...outcomeData,
          user_id: user?.id,
        })
        .select(`
          *,
          identity_area:identity_areas(*)
        `)
        .single();

      if (error) throw error;

      await fetchOutcomes();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updateOutcome = async (outcomeId: string, updates: Partial<Outcome>) => {
    try {
      const { data, error } = await supabase
        .from('outcomes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', outcomeId)
        .eq('user_id', user?.id)
        .select(`
          *,
          identity_area:identity_areas(*)
        `)
        .single();

      if (error) throw error;

      await fetchOutcomes();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const deleteOutcome = async (outcomeId: string) => {
    try {
      const { error } = await supabase
        .from('outcomes')
        .update({ status: 'archived' })
        .eq('id', outcomeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchOutcomes();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const updateProgress = async (outcomeId: string, progressPercentage: number) => {
    return updateOutcome(outcomeId, { progress_percentage: progressPercentage });
  };

  return {
    outcomes,
    loading,
    error,
    createOutcome,
    updateOutcome,
    deleteOutcome,
    updateProgress,
    refetch: fetchOutcomes,
  };
}