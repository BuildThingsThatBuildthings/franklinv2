import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useMicroActions } from '@/src/hooks/useMicroActions';
import { ActionCard } from '@/components/ActionCard';
import { DailyStatsCard } from '@/components/DailyStatsCard';
import { CreateActionModal } from '@/components/CreateActionModal';
import { router } from 'expo-router';
import { CircleCheck as CheckCircle, Crown, ArrowRight, Plus, Sun, Moon } from 'lucide-react-native';
import { useState } from 'react';

export default function TodayScreen() {
  const { user, isConfigured } = useAuth();
  const { hasActiveSubscription, subscription, loading, debugInfo } = useSubscription();
  const { 
    actions, 
    loading: actionsLoading, 
    dailyStats, 
    createMicroAction, 
    completeAction, 
    uncompleteAction,
    refetch: refetchActions 
  } = useMicroActions();
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleUpgradePress = () => {
    router.push('/(tabs)/subscription');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchActions();
    setRefreshing(false);
  };

  const handleCompleteAction = async (actionId: string) => {
    const { error } = await completeAction(actionId);
    if (error) {
      console.error('Error completing action:', error);
    }
  };

  const handleUncompleteAction = async (actionId: string) => {
    const { error } = await uncompleteAction(actionId);
    if (error) {
      console.error('Error uncompleting action:', error);
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour < 18) return <Sun size={20} color="#F59E0B" />;
    return <Moon size={20} color="#6366F1" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            {getTimeOfDayIcon()}
            <Text style={styles.greeting}>{getTimeOfDayGreeting()}!</Text>
          </View>
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
                  <Text style={styles.subscriptionTitle}>
                    {subscription?.subscription_status === 'not_started' ? 'Franklin Beta' : 'Franklin Premium'}
                  </Text>
                  <Text style={styles.subscriptionSubtitle}>
                    {subscription?.subscription_status === 'not_started' 
                      ? 'Beta tester access - thank you!' 
                      : subscription?.product_name || 'Active subscription'}
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

        {/* Daily Stats */}
        {dailyStats && (
          <DailyStatsCard stats={dailyStats} />
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Actions</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {actionsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your actions...</Text>
            </View>
          ) : actions.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No actions yet</Text>
              <Text style={styles.emptyMessage}>
                Create your first micro-action to start building your identity
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createFirstButtonText}>Create Your First Action</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onComplete={handleCompleteAction}
                  onUncomplete={handleUncompleteAction}
                />
              ))}
            </View>
          )}
        </View>

        {!isConfigured && (
          <View style={styles.welcomeCard}>
            <CheckCircle size={48} color="#059669" />
            <Text style={styles.welcomeTitle}>
              Welcome to Franklin - Demo Mode
            </Text>
            <Text style={styles.welcomeMessage}>
              Demo mode active. Configure Supabase in .env to enable real data persistence and sync.
            </Text>
          </View>
        )}

        {actions.length > 0 && (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              • 12-week outcome tracking{'\n'}
              • Advanced analytics & insights{'\n'}
              • Morning planning & evening reflection{'\n'}
              • AI-powered action recommendations
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateActionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={createMicroAction}
      />
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
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
  actionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
  },
  addButton: {
    backgroundColor: '#991B1B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  actionsList: {
    gap: 0,
  },
  emptyState: {
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
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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