import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IdentityArea } from '@/src/types/core';

export function useIdentityAreas() {
  const [identityAreas, setIdentityAreas] = useState<IdentityArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIdentityAreas();
  }, []);

  const fetchIdentityAreas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('identity_areas')
        .select('*')
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

  return {
    identityAreas,
    loading,
    error,
    refetch: fetchIdentityAreas,
  };
}