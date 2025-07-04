import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Reflection } from '@/src/types/core';

export function useReflections() {
  const { user, isConfigured } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [todayReflection, setTodayReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchReflections();
    fetchTodayReflection();
  }, [user, isConfigured]);

  const fetchReflections = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user?.id)
        .order('reflection_date', { ascending: false })
        .limit(30); // Get last 30 reflections

      if (fetchError) {
        throw fetchError;
      }

      setReflections(data || []);
    } catch (err: any) {
      console.error('Error fetching reflections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReflection = async (type: 'morning' | 'evening' = 'evening') => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('reflection_date', today)
        .eq('type', type)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setTodayReflection(data);
    } catch (err: any) {
      console.error('Error fetching today\'s reflection:', err);
    }
  };

  const createReflection = async (reflectionData: Partial<Reflection>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reflections')
        .insert({
          ...reflectionData,
          user_id: user?.id,
          reflection_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchReflections();
      await fetchTodayReflection(reflectionData.type as 'morning' | 'evening' || 'evening');
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updateReflection = async (reflectionId: string, updates: Partial<Reflection>) => {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reflectionId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      await fetchReflections();
      await fetchTodayReflection(updates.type as 'morning' | 'evening' || 'evening');
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const deleteReflection = async (reflectionId: string) => {
    try {
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', reflectionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchReflections();
      setTodayReflection(null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const getReflectionStats = () => {
    const totalReflections = reflections.length;
    const thisWeekReflections = reflections.filter(reflection => {
      const reflectionDate = new Date(reflection.reflection_date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return reflectionDate >= oneWeekAgo;
    }).length;

    const avgMood = reflections.length > 0 
      ? reflections
          .filter(r => r.overall_mood)
          .reduce((sum, r) => sum + (r.overall_mood || 0), 0) / reflections.filter(r => r.overall_mood).length
      : 0;

    const avgEnergy = reflections.length > 0 
      ? reflections
          .filter(r => r.energy_level)
          .reduce((sum, r) => sum + (r.energy_level || 0), 0) / reflections.filter(r => r.energy_level).length
      : 0;

    return {
      totalReflections,
      thisWeekReflections,
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
    };
  };

  return {
    reflections,
    todayReflection,
    loading,
    error,
    createReflection,
    updateReflection,
    deleteReflection,
    fetchTodayReflection,
    getReflectionStats,
    refetch: fetchReflections,
  };
}