import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { stripeProducts } from '@/src/stripe-config';
import { createCheckoutSession } from '@/src/services/stripe';
import { CreditCard, Check, Crown, Calendar } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

export default function SubscriptionScreen() {
  const { user, isConfigured } = useAuth();
  const { subscription, loading, hasActiveSubscription, isSubscriptionCanceled, debugInfo } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!isConfigured) {
      Alert.alert(
        'Demo Mode',
        'Subscription features are not available in demo mode. Please configure Supabase to enable payments.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setCheckoutLoading(true);

      const { url } = await createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl: `${window.location.origin}/subscription-success`,
        cancelUrl: `${window.location.origin}/subscription`,
      });

      await WebBrowser.openBrowserAsync(url);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start checkout process');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusDisplayText = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Trial';
      case 'past_due': return 'Past Due';
      case 'incomplete': return 'Incomplete';
      case 'canceled': return 'Canceled';
      case 'unpaid': return 'Unpaid';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status: string | undefined) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return { backgroundColor: '#D1FAE5' };
      case 'past_due':
      case 'incomplete':
        return { backgroundColor: '#FEF3C7' };
      case 'canceled':
      case 'unpaid':
        return { backgroundColor: '#FEE2E2' };
      default:
        return { backgroundColor: '#F3F4F6' };
    }
  };

  const getStatusTextStyle = (status: string | undefined) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return { color: '#059669' };
      case 'past_due':
      case 'incomplete':
        return { color: '#D97706' };
      case 'canceled':
      case 'unpaid':
        return { color: '#DC2626' };
      default:
        return { color: '#6B7280' };
    }
  };

  const handleSyncSubscription = async () => {
    if (!isConfigured || !user) return;

    try {
      setCheckoutLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Get customer ID
      const { data: customer } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer?.customer_id) {
        throw new Error('No customer record found');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
        // Refresh subscription data
        window.location.reload();
      } else {
        Alert.alert('Error', result.error || 'Failed to sync subscription');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync subscription');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#991B1B" />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Manage your Franklin subscription</Text>
        </View>

        {!isConfigured && (
          <View style={styles.demoNotice}>
            <Text style={styles.demoTitle}>Demo Mode</Text>
            <Text style={styles.demoText}>
              Subscription features are not available in demo mode. Configure Supabase to enable payments.
            </Text>
          </View>
        )}

        {isConfigured && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => setShowDebugInfo(!showDebugInfo)}
          >
            <Text style={styles.debugButtonText}>
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </Text>
          </TouchableOpacity>
        )}

        {showDebugInfo && debugInfo && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Information:</Text>
            <ScrollView style={styles.debugContent}>
              <Text style={styles.debugText}>
                {JSON.stringify(debugInfo, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {hasActiveSubscription() ? (
          <View style={styles.activeSubscription}>
            <View style={styles.subscriptionHeader}>
              <Crown size={32} color="#059669" />
              <Text style={styles.activeTitle}>Active Subscription</Text>
            </View>
            
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <Text style={styles.detailValue}>{subscription?.product_name || 'Franklin'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(subscription?.subscription_status)]}>
                  <Check size={16} color="#059669" />
                  <Text style={[styles.statusText, getStatusTextStyle(subscription?.subscription_status)]}>
                    {getStatusDisplayText(subscription?.subscription_status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next billing:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription?.current_period_end)}
                </Text>
              </View>
              
              {subscription?.payment_method_brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment method:</Text>
                  <Text style={styles.detailValue}>
                    {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                  </Text>
                </View>
              )}
              
              {isSubscriptionCanceled() && (
                <View style={styles.cancelNotice}>
                  <Calendar size={16} color="#F59E0B" />
                  <Text style={styles.cancelText}>
                    Subscription will cancel on {formatDate(subscription?.current_period_end)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
           <>
             {isConfigured && !hasActiveSubscription() && (
               <TouchableOpacity
                 style={styles.syncButton}
                 onPress={handleSyncSubscription}
                 disabled={checkoutLoading}
               >
                 <Text style={styles.syncButtonText}>
                   {checkoutLoading ? 'Syncing...' : 'Sync Subscription from Stripe'}
                 </Text>
               </TouchableOpacity>
             )}
             <View style={styles.subscriptionPlans}>
               <Text style={styles.plansTitle}>Choose Your Plan</Text>
               
               {stripeProducts.map((product) => (
                 <View key={product.id} style={styles.planCard}>
                   <View style={styles.planHeader}>
                     <Text style={styles.planName}>{product.name}</Text>
                     <View style={styles.priceContainer}>
                       <Text style={styles.price}>${product.price}</Text>
                       <Text style={styles.interval}>/{product.interval}</Text>
                     </View>
                   </View>
                   
                   <Text style={styles.planDescription}>{product.description}</Text>
                   
                   <TouchableOpacity
                     style={[styles.subscribeButton, checkoutLoading && styles.buttonDisabled]}
                     onPress={() => handleSubscribe(product.priceId)}
                     disabled={checkoutLoading || !isConfigured}
                   >
                     {checkoutLoading ? (
                       <ActivityIndicator size="small" color="#FFFFFF" />
                     ) : (
                       <>
                         <CreditCard size={20} color="#FFFFFF" />
                         <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                       </>
                     )}
                   </TouchableOpacity>
                 </View>
               ))}
             </View>
           </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF9F3',
  },
  scrollContent: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  demoNotice: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 20,
  },
  activeSubscription: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  activeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginLeft: 12,
  },
  subscriptionDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginLeft: 4,
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  subscriptionPlans: {
    gap: 16,
  },
  plansTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#991B1B',
  },
  interval: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  subscribeButton: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  syncButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  debugButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  debugContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  debugContent: {
    flex: 1,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 14,
  },
});