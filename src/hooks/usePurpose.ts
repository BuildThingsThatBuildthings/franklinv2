import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Purpose {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function usePurpose() {
  const { user, isConfigured } = useAuth();
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchPurpose();
  }, [user, isConfigured]);

  const fetchPurpose = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('purposes')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setPurpose(data);
    } catch (err: any) {
      console.error('Error fetching purpose:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPurpose = async (purposeData: Partial<Purpose>) => {
    try {
      const { data, error } = await supabase
        .from('purposes')
        .insert({
          ...purposeData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPurpose();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updatePurpose = async (purposeId: string, updates: Partial<Purpose>) => {
    try {
      const { data, error } = await supabase
        .from('purposes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', purposeId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      await fetchPurpose();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const deletePurpose = async (purposeId: string) => {
    try {
      const { error } = await supabase
        .from('purposes')
        .delete()
        .eq('id', purposeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchPurpose();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    purpose,
    loading,
    error,
    createPurpose,
    updatePurpose,
    deletePurpose,
    refetch: fetchPurpose,
  };
}