import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MicroAction } from '@/src/types/core';
import { CircleCheck as CheckCircle, Circle, Clock, Flame, Target, Zap } from 'lucide-react-native';

interface ActionCardProps {
  action: MicroAction;
  onComplete: (actionId: string) => void;
  onUncomplete: (actionId: string) => void;
  onPress?: () => void;
}

export function ActionCard({ action, onComplete, onUncomplete, onPress }: ActionCardProps) {
  const handleToggleComplete = () => {
    if (action.completed_today) {
      onUncomplete(action.id);
    } else {
      onComplete(action.id);
    }
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#DC2626'];
    return colors[level - 1] || '#6B7280';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return labels[level - 1] || 'Unknown';
  };

  return (
    <View style={[styles.container, action.completed_today && styles.completedContainer]}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, action.completed_today && styles.completedTitle]}>
              {action.title}
            </Text>
            {action.identity_tag && (
              <Text style={styles.identityTag}>
                {action.identity_tag}
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.checkButton}
            onPress={handleToggleComplete}
            activeOpacity={0.7}
          >
            {action.completed_today ? (
              <CheckCircle size={28} color="#10B981" />
            ) : (
              <Circle size={28} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        {action.description && (
          <Text style={styles.description}>
            {action.description}
          </Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.metadataText}>
              {action.estimated_minutes} min
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Zap size={16} color={getDifficultyColor(action.difficulty_level)} />
            <Text style={styles.metadataText}>
              {getDifficultyLabel(action.difficulty_level)}
            </Text>
          </View>

          {action.current_streak && action.current_streak > 0 && (
            <View style={styles.metadataItem}>
              <Flame size={16} color="#F97316" />
              <Text style={styles.streakText}>
                {action.current_streak} day{action.current_streak !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {action.outcome && (
            <View style={styles.metadataItem}>
              <Target size={16} color="#8B5CF6" />
              <Text style={styles.outcomeText} numberOfLines={1}>
                {action.outcome.title}
              </Text>
            </View>
          )}
        </View>

        {action.identity_area && (
          <View style={[styles.categoryBadge, { backgroundColor: action.identity_area.color + '20' }]}>
            <Text style={[styles.categoryText, { color: action.identity_area.color }]}>
              {action.identity_area.name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 6,
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
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  identityTag: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  checkButton: {
    padding: 4,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F97316',
  },
  outcomeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
    maxWidth: 100,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
});