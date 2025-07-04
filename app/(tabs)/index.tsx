import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { router } from 'expo-router';
import { CircleCheck as CheckCircle, Crown, ArrowRight } from 'lucide-react-native';

export default function TodayScreen() {
  const { user, isConfigured } = useAuth();
  const { hasActiveSubscription, subscription, loading } = useSubscription();

  const handleUpgradePress = () => {
    router.push('/(tabs)/subscription');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.email}>
            {user?.email}
            {!isConfigured && ' (Demo Mode)'}
          </Text>
        </View>

        {isConfigured && !loading && (
          <View style={styles.subscriptionStatus}>
            {hasActiveSubscription() ? (
              <View style={styles.activeSubscriptionBanner}>
                <Crown size={24} color="#059669" />
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionTitle}>Franklin Premium</Text>
                  <Text style={styles.subscriptionSubtitle}>
                    {subscription?.product_name || 'Active subscription'}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.upgradePrompt} onPress={handleUpgradePress}>
                <View style={styles.upgradeContent}>
                  <Text style={styles.upgradeTitle}>Unlock Franklin Premium</Text>
                  <Text style={styles.upgradeSubtitle}>
                    Transform your identity with daily micro-actions
                  </Text>
                </View>
                <ArrowRight size={20} color="#991B1B" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.welcomeCard}>
          <CheckCircle size={48} color="#059669" />
          <Text style={styles.welcomeTitle}>
            Welcome to Franklin{!isConfigured && ' - Demo Mode'}
          </Text>
          <Text style={styles.welcomeMessage}>
            {isConfigured 
              ? "You've successfully signed in. Start building your identity through daily micro-actions."
              : "Demo mode active. Configure Supabase in .env to enable real authentication."
            }
          </Text>
        </View>

        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            • Daily micro-step planning{'\n'}
            • Identity-based goal tracking{'\n'}
            • Morning plan & evening reflection{'\n'}
            • Progress analytics & insights
          </Text>
        </View>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  subscriptionStatus: {
    marginBottom: 24,
  },
  activeSubscriptionBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  subscriptionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#047857',
  },
  upgradePrompt: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#991B1B',
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F1D1D',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoon: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});