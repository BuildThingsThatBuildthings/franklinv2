import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useIdentityAreas } from '@/src/hooks/useIdentityAreas';
import { MicroAction } from '@/src/types/core';
import { X, Plus, Zap, Clock } from 'lucide-react-native';

interface CreateActionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (actionData: Partial<MicroAction>) => Promise<{ data: any; error: any }>;
}

export function CreateActionModal({ visible, onClose, onCreate }: CreateActionModalProps) {
  const { identityAreas } = useIdentityAreas();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [identityTag, setIdentityTag] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIdentityTag('');
    setSelectedAreaId(null);
    setDifficultyLevel(1);
    setEstimatedMinutes(5);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an action title');
      return;
    }

    setLoading(true);
    const { error } = await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      identity_tag: identityTag.trim() || undefined,
      identity_area_id: selectedAreaId || undefined,
      difficulty_level: difficultyLevel,
      estimated_minutes: estimatedMinutes,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      resetForm();
      onClose();
    }
    setLoading(false);
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Action</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Action Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Do 10 push-ups"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details about this action..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Identity Statement</Text>
            <TextInput
              style={styles.input}
              value={identityTag}
              onChangeText={setIdentityTag}
              placeholder="I am someone who..."
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>
              Connect this action to your identity (e.g., "I am someone who prioritizes health")
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Virtue Area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areasScroll}>
              <TouchableOpacity
                style={[styles.areaChip, !selectedAreaId && styles.areaChipSelected]}
                onPress={() => setSelectedAreaId(null)}
              >
                <Text style={[styles.areaChipText, !selectedAreaId && styles.areaChipTextSelected]}>
                  None
                </Text>
              </TouchableOpacity>
              {identityAreas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.areaChip,
                    { borderColor: area.color },
                    selectedAreaId === area.id && [styles.areaChipSelected, { backgroundColor: area.color + '20' }]
                  ]}
                  onPress={() => setSelectedAreaId(area.id)}
                >
                  <Text 
                    style={[
                      styles.areaChipText,
                      selectedAreaId === area.id && { color: area.color }
                    ]}
                  >
                    {area.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>
                <Clock size={16} color="#6B7280" /> Time (minutes)
              </Text>
              <TextInput
                style={styles.input}
                value={estimatedMinutes.toString()}
                onChangeText={(text) => setEstimatedMinutes(parseInt(text) || 5)}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.section, styles.halfWidth]}>
              <Text style={styles.label}>
                <Zap size={16} color={getDifficultyColor(difficultyLevel)} /> Difficulty
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyChip,
                      { borderColor: getDifficultyColor(level) },
                      difficultyLevel === level && { backgroundColor: getDifficultyColor(level) + '20' }
                    ]}
                    onPress={() => setDifficultyLevel(level)}
                  >
                    <Text 
                      style={[
                        styles.difficultyText,
                        difficultyLevel === level && { color: getDifficultyColor(level) }
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.helpText}>
                {getDifficultyLabel(difficultyLevel)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Action'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  areasScroll: {
    marginTop: 8,
  },
  areaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  areaChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  areaChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  areaChipTextSelected: {
    color: '#6366F1',
    fontFamily: 'Inter-SemiBold',
  },
  difficultyChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  difficultyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createButton: {
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});