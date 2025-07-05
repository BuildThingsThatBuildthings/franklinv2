import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Outcome } from '@/src/types/core';
import { Target, Calendar, TrendingUp, CircleCheck as CheckCircle, Clock, Pause, Archive, Star } from 'lucide-react-native';

interface OutcomeCardProps {
  outcome: Outcome;
  onPress?: () => void;
  onUpdateProgress?: (progress: number) => void;
}

export function OutcomeCard({ outcome, onPress, onUpdateProgress }: OutcomeCardProps) {
  const getStatusIcon = () => {
    switch (outcome.status) {
      case 'completed':
        return <CheckCircle size={20} color="#10B981" />;
      case 'paused':
        return <Pause size={20} color="#F59E0B" />;
      case 'archived':
        return <Archive size={20} color="#6B7280" />;
      default:
        return <Target size={20} color="#3B82F6" />;
    }
  };

  const getStatusColor = () => {
    switch (outcome.status) {
      case 'completed':
        return '#10B981';
      case 'paused':
        return '#F59E0B';
      case 'archived':
        return '#6B7280';
      default:
        return '#3B82F6';
    }
  };

  const getStatusText = () => {
    switch (outcome.status) {
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'archived':
        return 'Archived';
      default:
        return 'Active';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!outcome.target_date) return null;
    const today = new Date();
    const targetDate = new Date(outcome.target_date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        outcome.status === 'completed' && styles.completedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, outcome.status === 'completed' && styles.completedTitle]}>
            {outcome.title}
          </Text>
          <View style={styles.statusContainer}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </View>

      {outcome.description && (
        <Text style={styles.description} numberOfLines={2}>
          {outcome.description}
        </Text>
      )}

      {outcome.identity_statement && (
        <View style={styles.identityContainer}>
          <Text style={styles.identityText}>
            "{outcome.identity_statement}"
          </Text>
        </View>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{outcome.progress_percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${outcome.progress_percentage}%`,
                backgroundColor: getStatusColor()
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.metadata}>
        {outcome.target_date && (
          <View style={styles.metadataItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.metadataText}>
              {formatDate(outcome.target_date)}
            </Text>
            {daysRemaining !== null && (
              <Text style={[
                styles.daysRemaining,
                daysRemaining < 0 ? styles.overdue : daysRemaining <= 7 ? styles.urgent : styles.normal
              ]}>
                {daysRemaining < 0 
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : daysRemaining === 0 
                    ? 'Due today'
                    : `${daysRemaining} days left`
                }
              </Text>
            )}
          </View>
        )}

        {outcome.identity_area && (
          <View style={styles.metadataItem}>
            <TrendingUp size={16} color={outcome.identity_area.color} />
            <Text style={[styles.categoryText, { color: outcome.identity_area.color }]}>
              {outcome.identity_area.name}
            </Text>
          </View>
        )}

        <View style={styles.metadataItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.metadataText}>
            Created {formatDate(outcome.created_at)}
          </Text>
        </View>

        <View style={styles.metadataItem}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.xpText}>
            +{outcome.xp_awarded || 100} XP on completion
          </Text>
        </View>
      </View>

      {outcome.identity_area && (
        <View style={[styles.categoryBadge, { backgroundColor: outcome.identity_area.color + '20' }]}>
          <Text style={[styles.categoryBadgeText, { color: outcome.identity_area.color }]}>
            {outcome.identity_area.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
  completedContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  completedTitle: {
    color: '#059669',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  identityContainer: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderRadius: 6,
  },
  identityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4338CA',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  progressValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  xpText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  daysRemaining: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  urgent: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  overdue: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  normal: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
});