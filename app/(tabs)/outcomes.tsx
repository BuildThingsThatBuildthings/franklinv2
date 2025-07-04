import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useOutcomes } from '@/src/hooks/useOutcomes';
import { OutcomeCard } from '@/components/OutcomeCard';
import { CreateOutcomeModal } from '@/components/CreateOutcomeModal';
import { Target, Plus, TrendingUp, Calendar, CheckCircle } from 'lucide-react-native';

export default function OutcomesScreen() {
  const { 
    outcomes, 
    loading, 
    error, 
    createOutcome, 
    updateProgress, 
    refetch 
  } = useOutcomes();
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const activeOutcomes = outcomes.filter(outcome => outcome.status === 'active');
  const completedOutcomes = outcomes.filter(outcome => outcome.status === 'completed');
  const totalProgress = activeOutcomes.length > 0 
    ? Math.round(activeOutcomes.reduce((sum, outcome) => sum + outcome.progress_percentage, 0) / activeOutcomes.length)
    : 0;

  const getUpcomingDeadlines = () => {
    const today = new Date();
    const upcoming = activeOutcomes
      .filter(outcome => outcome.target_date)
      .map(outcome => ({
        ...outcome,
        daysRemaining: Math.ceil((new Date(outcome.target_date!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .filter(outcome => outcome.daysRemaining >= 0 && outcome.daysRemaining <= 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    return upcoming.slice(0, 3);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>12-Week Outcomes</Text>
          <Text style={styles.subtitle}>Transform your identity through focused goals</Text>
        </View>

        {/* Stats Overview */}
        {activeOutcomes.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
                  <Target size={20} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{activeOutcomes.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{completedOutcomes.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
                  <TrendingUp size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.statValue}>{totalProgress}%</Text>
                <Text style={styles.statLabel}>Avg Progress</Text>
              </View>
            </View>
          </View>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deadlinesScroll}>
              {upcomingDeadlines.map((outcome) => (
                <View key={outcome.id} style={styles.deadlineCard}>
                  <Text style={styles.deadlineTitle} numberOfLines={2}>
                    {outcome.title}
                  </Text>
                  <Text style={[
                    styles.deadlineDays,
                    outcome.daysRemaining <= 7 ? styles.deadlineUrgent : styles.deadlineNormal
                  ]}>
                    {outcome.daysRemaining === 0 ? 'Due today' : `${outcome.daysRemaining} days left`}
                  </Text>
                  <View style={styles.deadlineProgress}>
                    <View style={[styles.deadlineProgressFill, { width: `${outcome.progress_percentage}%` }]} />
                  </View>
                  <Text style={styles.deadlineProgressText}>{outcome.progress_percentage}% complete</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Outcomes List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#1E3A8A" />
            <Text style={styles.sectionTitle}>Your Outcomes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your outcomes...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading outcomes: {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : outcomes.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No outcomes yet</Text>
              <Text style={styles.emptyMessage}>
                Start by creating your first 12-week outcome. What do you want to achieve?
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createFirstButtonText}>Create Your First Outcome</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.outcomesList}>
              {/* Active Outcomes */}
              {activeOutcomes.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Active Outcomes</Text>
                  {activeOutcomes.map((outcome) => (
                    <OutcomeCard
                      key={outcome.id}
                      outcome={outcome}
                      onUpdateProgress={(progress) => updateProgress(outcome.id, progress)}
                    />
                  ))}
                </>
              )}

              {/* Completed Outcomes */}
              {completedOutcomes.length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Completed Outcomes</Text>
                  {completedOutcomes.map((outcome) => (
                    <OutcomeCard
                      key={outcome.id}
                      outcome={outcome}
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </View>

        {outcomes.length > 0 && (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              • Advanced progress tracking{'\n'}
              • Milestone breakdown{'\n'}
              • AI-powered recommendations{'\n'}
              • Outcome templates{'\n'}
              • Progress analytics
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateOutcomeModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={createOutcome}
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
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#991B1B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  deadlinesScroll: {
    marginTop: 8,
  },
  deadlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deadlineTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    height: 36,
  },
  deadlineDays: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  deadlineUrgent: {
    color: '#DC2626',
  },
  deadlineNormal: {
    color: '#F59E0B',
  },
  deadlineProgress: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginBottom: 4,
  },
  deadlineProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  deadlineProgressText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  outcomesList: {
    gap: 0,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
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
    marginBottom: 24,
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