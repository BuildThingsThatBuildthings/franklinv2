import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { IdentityArea } from '@/src/types/core';

export function useIdentityAreas() {
  const { user, isConfigured } = useAuth();
  const [identityAreas, setIdentityAreas] = useState<IdentityArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchIdentityAreas();
  }, [user, isConfigured]);

  const fetchIdentityAreas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('identity_areas')
        .select('*')
        .eq('user_id', user?.id)
        .order('sort_order');

      if (fetchError) {
        throw fetchError;
      }

      setIdentityAreas(data || []);
    } catch (err: any) {
      console.error('Error fetching identity areas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createIdentityArea = async (areaData: Partial<IdentityArea>) => {
    try {
      const { data, error } = await supabase
        .from('identity_areas')
        .insert({
          ...areaData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchIdentityAreas();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const updateIdentityArea = async (areaId: string, updates: Partial<IdentityArea>) => {
    try {
      const { data, error } = await supabase
        .from('identity_areas')
        .update(updates)
        .eq('id', areaId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      await fetchIdentityAreas();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const deleteIdentityArea = async (areaId: string) => {
    try {
      const { error } = await supabase
        .from('identity_areas')
        .delete()
        .eq('id', areaId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchIdentityAreas();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    identityAreas,
    loading,
    error,
    createIdentityArea,
    updateIdentityArea,
    deleteIdentityArea,
    refetch: fetchIdentityAreas,
  };
}