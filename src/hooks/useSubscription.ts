import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getProductByPriceId } from '@/src/stripe-config';

export interface UserSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  product_name?: string;
}

export function useSubscription() {
  const { user, isConfigured } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user, isConfigured]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const product = data.price_id ? getProductByPriceId(data.price_id) : null;
        setSubscription({
          ...data,
          product_name: product?.name,
        });
      } else {
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = () => {
    return subscription?.subscription_status === 'active';
  };

  const isSubscriptionCanceled = () => {
    return subscription?.cancel_at_period_end === true;
  };

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription,
    isSubscriptionCanceled,
    refetch: fetchSubscription,
  };
}