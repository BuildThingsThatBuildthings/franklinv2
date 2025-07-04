import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/src/hooks/useSubscription';
import { CircleCheck as CheckCircle, ArrowRight } from 'lucide-react-native';

export default function SubscriptionSuccessScreen() {
  const { refetch } = useSubscription();

  useEffect(() => {
    // Refetch subscription data when the success page loads
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <CheckCircle size={80} color="#059669" />
        </View>
        
        <Text style={styles.title}>Welcome to Franklin Premium!</Text>
        
        <Text style={styles.message}>
          Your subscription has been activated successfully. You now have access to all premium features to help transform your identity through daily micro-actions.
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          <Text style={styles.featureItem}>• Unlimited 12-week outcomes</Text>
          <Text style={styles.featureItem}>• Daily micro-step planning</Text>
          <Text style={styles.featureItem}>• Morning planning & evening reflection</Text>
          <Text style={styles.featureItem}>• Progress analytics & insights</Text>
          <Text style={styles.featureItem}>• Priority support</Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Start Your Journey</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF9F3',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});