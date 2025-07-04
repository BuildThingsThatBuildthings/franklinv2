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
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

      // First, let's check what's in the stripe_customers table
      const { data: customerData, error: customerError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null);

      // Check the stripe_subscriptions table directly
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .is('deleted_at', null);

      // Now check the view
      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      // Set debug info for troubleshooting
      setDebugInfo({
        userId: user?.id,
        customerData,
        customerError,
        subscriptionData,
        subscriptionError,
        viewData: data,
        viewError: fetchError,
        timestamp: new Date().toISOString(),
      });

      if (fetchError) {
        console.error('Error fetching subscription from view:', fetchError);
        throw fetchError;
      }

      if (data) {
        console.log('Subscription data found:', data);
        const product = data.price_id ? getProductByPriceId(data.price_id) : null;
        setSubscription({
          ...data,
          product_name: product?.name,
        });
      } else {
        console.log('No subscription data found in view');
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
    console.log('Checking subscription status:', subscription?.subscription_status);
    
    // If we have a customer record, they should have access (for beta/test users)
    if (subscription?.customer_id) {
      // Support all subscription statuses that should have access to features
      const validStatuses = ['active', 'trialing', 'past_due', 'incomplete'];
      
      // Also grant access if they have a customer_id (beta/test users)
      // or if they have an active/valid subscription
      return subscription.subscription_status && 
             (validStatuses.includes(subscription.subscription_status) || 
              subscription.customer_id !== null);
    }
    
    return false;
  };

  const isSubscriptionCanceled = () => {
    return subscription?.cancel_at_period_end === true;
  };

  return {
    subscription,
    loading,
    error,
    debugInfo,
    hasActiveSubscription,
    isSubscriptionCanceled,
    refetch: fetchSubscription,
  };
}