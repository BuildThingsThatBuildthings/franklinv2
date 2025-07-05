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
import { Outcome } from '@/src/types/core';
import { X, Plus, Target, Calendar, Lightbulb } from 'lucide-react-native';

interface CreateOutcomeModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (outcomeData: Partial<Outcome>) => Promise<{ data: any; error: any }>;
}

export function CreateOutcomeModal({ visible, onClose, onCreate }: CreateOutcomeModalProps) {
  const { identityAreas } = useIdentityAreas();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIdentityStatement('');
    setTargetDate('');
    setSelectedAreaId(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an outcome title');
      return;
    }

    setLoading(true);
    const { error } = await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      identity_statement: identityStatement.trim() || undefined,
      target_date: targetDate.trim() || undefined,
      identity_area_id: selectedAreaId || undefined,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      resetForm();
      onClose();
    }
    setLoading(false);
  };

  const suggestedIdentityStatements = [
    'I am someone who consistently works toward my goals',
    'I am someone who takes care of my health and wellbeing',
    'I am someone who builds meaningful relationships',
    'I am someone who continuously learns and grows',
    'I am someone who creates and innovates',
    'I am someone who manages money wisely',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New 12-Week Outcome</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>
              <Target size={16} color="#6B7280" /> What do you want to achieve? *
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Lose 20 pounds and build muscle"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Text style={styles.helpText}>
              Be specific and measurable. This is your 12-week destination.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Why is this outcome important to you? What will achieving it mean?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Lightbulb size={16} color="#6B7280" /> Identity Statement
            </Text>
            <TextInput
              style={styles.input}
              value={identityStatement}
              onChangeText={setIdentityStatement}
              placeholder="I am someone who..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Text style={styles.helpText}>
              Connect this outcome to your identity. Who do you want to become?
            </Text>
            
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {suggestedIdentityStatements.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => setIdentityStatement(suggestion)}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Calendar size={16} color="#6B7280" /> Target Date
            </Text>
            <TextInput
              style={styles.input}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="YYYY-MM-DD (e.g., 2024-03-15)"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helpText}>
              Optional: Set a specific deadline for this outcome
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

          <View style={styles.outcomeInfo}>
            <Text style={styles.outcomeInfoTitle}>12-Week Outcomes</Text>
            <Text style={styles.outcomeInfoText}>
              Research shows that 12 weeks is the optimal timeframe for creating lasting change. 
              It's long enough to build momentum and see real results, but short enough to maintain focus and motivation.
            </Text>
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
              {loading ? 'Creating...' : 'Create Outcome'}
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
    flex: 1,
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
    height: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  suggestionsScroll: {
    marginTop: 4,
  },
  suggestionChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    width: 200,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
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
  outcomeInfo: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  outcomeInfoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0369A1',
    marginBottom: 4,
  },
  outcomeInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    lineHeight: 16,
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

export { CreateOutcomeModal }