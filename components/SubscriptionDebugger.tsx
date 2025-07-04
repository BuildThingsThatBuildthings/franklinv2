import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function SubscriptionDebugger() {
  const { user, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!isConfigured || !user) {
      Alert.alert('Error', 'Not configured or not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Check all relevant tables
      const diagnostics: any = {};

      // 1. Check stripe_customers table
      const { data: customers, error: customersError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id);

      diagnostics.customers = { data: customers, error: customersError };

      // 2. Check stripe_subscriptions table
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('stripe_subscriptions')
        .select('*');

      diagnostics.subscriptions = { data: subscriptions, error: subscriptionsError };

      // 3. Check the view
      const { data: userSubs, error: userSubsError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*');

      diagnostics.userSubscriptions = { data: userSubs, error: userSubsError };

      // 4. Check RLS policies by testing direct queries
      const { data: testCustomer, error: testCustomerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      diagnostics.testCustomer = { data: testCustomer, error: testCustomerError };

      if (testCustomer?.customer_id) {
        const { data: testSub, error: testSubError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', testCustomer.customer_id)
          .maybeSingle();

        diagnostics.testSubscription = { data: testSub, error: testSubError };
        
        // 5. Check what's actually in Stripe for this customer
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/debug-stripe-customer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              customer_id: testCustomer.customer_id,
            }),
          });
          
          if (response.ok) {
            diagnostics.stripeData = await response.json();
          } else {
            diagnostics.stripeData = { error: 'Failed to fetch Stripe data' };
          }
        } catch (error) {
          diagnostics.stripeData = { error: `Stripe fetch error: ${error}` };
        }
      }

      setDebugData(diagnostics);
    } catch (error) {
      Alert.alert('Error', `Diagnostics failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fixSubscriptionStatus = async () => {
    if (!isConfigured || !user) return;

    Alert.alert(
      'Sync Subscription from Stripe',
      'This will fetch the latest subscription data from Stripe and update the local database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              // Get customer ID
              const { data: customer } = await supabase
                .from('stripe_customers')
                .select('customer_id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (customer?.customer_id) {
                // Call our sync function to fetch latest data from Stripe
                const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-subscription`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  },
                  body: JSON.stringify({
                    customer_id: customer.customer_id,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to sync subscription');
                }

                const result = await response.json();
                
                if (result.success) {
                  Alert.alert('Success', 'Subscription synced successfully from Stripe');
                  runDiagnostics(); // Refresh debug data
                } else {
                  Alert.alert('Error', result.error || 'Failed to sync subscription');
                }
              } else {
                Alert.alert('Error', 'No customer record found');
              }
            } catch (error) {
              Alert.alert('Error', `Fix failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Subscription Debugger</Text>
        <Text style={styles.text}>Not available in demo mode</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Debugger</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runDiagnostics}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Text>
        </TouchableOpacity>

        {debugData && (
          <TouchableOpacity
            style={styles.fixButton}
            onPress={fixSubscriptionStatus}
          >
            <Text style={styles.buttonText}>Sync from Stripe</Text>
          </TouchableOpacity>
        )}
      </View>

      {debugData && (
        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Diagnostic Results:</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(debugData, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#991B1B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  fixButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    maxHeight: 400,
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 14,
  },
});