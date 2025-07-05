import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyStats } from '@/src/types/core';
import { CircleCheck as CheckCircle, Clock, Target, TrendingUp, Star, Zap } from 'lucide-react-native';

interface DailyStatsCardProps {
  stats: DailyStats;
  totalXpToday?: number;
  identityAreas?: any[];
}

export function DailyStatsCard({ stats, totalXpToday = 0, identityAreas = [] }: DailyStatsCardProps) {
  const getMotivationalMessage = () => {
    if (stats.completion_rate === 100) {
      return "Perfect day! You're building amazing momentum! 🎉";
    } else if (stats.completion_rate >= 80) {
      return "Excellent progress! Keep up the great work! 💪";
    } else if (stats.completion_rate >= 60) {
      return "Good job! You're on the right track! 👏";
    } else if (stats.completion_rate >= 40) {
      return "Every step counts! You're building your identity! 🌱";
    } else if (stats.completed_actions > 0) {
      return "Great start! Small actions create big changes! ✨";
    } else {
      return "Today is a fresh start! You've got this! 🚀";
    }
  };

  const getCompletionColor = () => {
    if (stats.completion_rate >= 80) return '#10B981';
    if (stats.completion_rate >= 60) return '#F59E0B';
    if (stats.completion_rate >= 40) return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Progress</Text>
        <Text style={styles.motivationText}>
          {getMotivationalMessage()}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: getCompletionColor() + '20' }]}>
            <CheckCircle size={20} color={getCompletionColor()} />
          </View>
          <Text style={styles.statValue}>
            {stats.completed_actions}/{stats.total_actions}
          </Text>
          <Text style={styles.statLabel}>Actions</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
            <Target size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>
            {stats.completion_rate}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
            <Clock size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>
            {stats.total_minutes_completed}
          </Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#F9731620' }]}>
            <TrendingUp size={20} color="#F97316" />
          </View>
          <Text style={styles.statValue}>
            {stats.current_streaks}
          </Text>
          <Text style={styles.statLabel}>Streaks</Text>
        </View>
      </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Star size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>
            {totalXpToday}
          </Text>
          <Text style={styles.statLabel}>XP Today</Text>
        </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${stats.completion_rate}%`,
                backgroundColor: getCompletionColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {stats.completion_rate}% of daily actions completed
        </Text>
      </View>

      {/* Identity Areas Level Progress */}
      {identityAreas.length > 0 && (
        <View style={styles.identityProgress}>
          <Text style={styles.identityProgressTitle}>Virtue Progress</Text>
          {identityAreas.slice(0, 3).map((area) => (
            <View key={area.id} style={styles.identityAreaRow}>
              <View style={styles.identityAreaInfo}>
                <Text style={[styles.identityAreaName, { color: area.color }]}>
                  {area.name}
                </Text>
                <Text style={styles.identityAreaLevel}>
                  Level {area.level || 0} • {area.current_xp || 0} XP
                </Text>
              </View>
              <View style={styles.identityAreaLevelBar}>
                <View 
                  style={[
                    styles.identityAreaLevelFill, 
                    { 
                      width: `${((area.current_xp || 0) % 100)}%`,
                      backgroundColor: area.color
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    fontSize: 18,
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
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  identityProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  identityProgressTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  identityAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  identityAreaInfo: {
    flex: 1,
    marginRight: 12,
  },
  identityAreaName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  identityAreaLevel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  identityAreaLevelBar: {
    width: 60,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  identityAreaLevelFill: {
    height: '100%',
    borderRadius: 2,
  },
});