import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl 
} from 'react-native';
import { usePurpose } from '@/src/hooks/usePurpose';
import { useAuth } from '@/contexts/AuthContext';
import { Mountain, Target, TrendingUp, Star, Plus, Edit3, Save, X, Compass, Flame } from 'lucide-react-native';

export default function PurposeScreen() {
  const { user, isConfigured } = useAuth();
  const { purpose, loading, error, createPurpose, updatePurpose, refetch } = usePurpose();
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (purpose) {
      setTitle(purpose.title);
      setDescription(purpose.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [purpose, isEditing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a purpose title');
      return;
    }

    setSaving(true);
    
    const purposeData = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    let result;
    if (purpose) {
      result = await updatePurpose(purpose.id, purposeData);
    } else {
      result = await createPurpose(purposeData);
    }

    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      setIsEditing(false);
      Alert.alert('Success', 'Purpose saved successfully!');
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    if (purpose) {
      setTitle(purpose.title);
      setDescription(purpose.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setIsEditing(false);
  };

  const purposeExamples = [
    "Build a sustainable business that creates meaningful impact",
    "Become the healthiest version of myself physically and mentally",
    "Master the art of deep work and creative expression",
    "Create a loving family and strong community connections",
    "Achieve financial freedom while helping others succeed",
    "Develop expertise that can solve real-world problems"
  ];

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.demoContainer}>
          <Mountain size={48} color="#D1D5DB" />
          <Text style={styles.demoTitle}>Purpose Declaration</Text>
          <Text style={styles.demoMessage}>
            Demo mode active. Configure Supabase to define your 10× Purpose and track your identity transformation.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Mountain size={28} color="#991B1B" />
          </View>
          <Text style={styles.title}>Your 10× Purpose</Text>
          <Text style={styles.subtitle}>
            Define the audacious goal that excites and scares you
          </Text>
        </View>

        {/* OODA Loop Overview */}
        <View style={styles.ooodaContainer}>
          <Text style={styles.ooodaTitle}>OODA Loop Framework</Text>
          <View style={styles.ooodaSteps}>
            <View style={styles.ooodaStep}>
              <View style={[styles.ooodaStepIcon, { backgroundColor: '#3B82F620' }]}>
                <Compass size={16} color="#3B82F6" />
              </View>
              <Text style={styles.ooodaStepTitle}>ORIENT</Text>
              <Text style={styles.ooodaStepText}>See the mountain & name it</Text>
            </View>
            <View style={styles.ooodaStep}>
              <View style={[styles.ooodaStepIcon, { backgroundColor: '#F59E0B20' }]}>
                <Target size={16} color="#F59E0B" />
              </View>
              <Text style={styles.ooodaStepTitle}>OBSERVE</Text>
              <Text style={styles.ooodaStepText}>Expose the gaps</Text>
            </View>
            <View style={styles.ooodaStep}>
              <View style={[styles.ooodaStepIcon, { backgroundColor: '#8B5CF620' }]}>
                <TrendingUp size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.ooodaStepTitle}>DECIDE</Text>
              <Text style={styles.ooodaStepText}>Craft the climb</Text>
            </View>
            <View style={styles.ooodaStep}>
              <View style={[styles.ooodaStepIcon, { backgroundColor: '#10B98120' }]}>
                <Flame size={16} color="#10B981" />
              </View>
              <Text style={styles.ooodaStepTitle}>ACT</Text>
              <Text style={styles.ooodaStepText}>Climb, adapt, repeat</Text>
            </View>
          </View>
        </View>

        {/* Purpose Form */}
        <View style={styles.purposeForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {purpose ? 'Your Purpose' : 'Define Your Purpose'}
            </Text>
            {purpose && !isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Edit3 size={16} color="#6366F1" />
              </TouchableOpacity>
            )}
            {isEditing && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Save size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            {!purpose && (
              <TouchableOpacity
                style={[styles.createButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {(isEditing || !purpose) ? (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>What is your 10× Goal? *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What audacious goal excites and scares you?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
                <Text style={styles.helpText}>
                  Think 10 times bigger than what feels safe. This should feel both exciting and intimidating.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Why does this matter?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What will achieving this mean for you and others? What's the deeper purpose?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Purpose Examples */}
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Purpose Examples</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesScroll}>
                  {purposeExamples.map((example, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.exampleChip}
                      onPress={() => setTitle(example)}
                    >
                      <Text style={styles.exampleText} numberOfLines={3}>
                        {example}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : purpose ? (
            <View style={styles.readOnlyPurpose}>
              <View style={styles.purposeContent}>
                <Text style={styles.purposeTitle}>{purpose.title}</Text>
                {purpose.description && (
                  <Text style={styles.purposeDescription}>{purpose.description}</Text>
                )}
              </View>
              <View style={styles.purposeDate}>
                <Text style={styles.purposeDateText}>
                  Defined {new Date(purpose.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyPurpose}>
              <Mountain size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No purpose defined yet</Text>
              <Text style={styles.emptyMessage}>
                Start by defining your 10× goal that will guide all your outcomes and actions
              </Text>
            </View>
          )}
        </View>

        {/* Framework Info */}
        <View style={styles.frameworkInfo}>
          <Text style={styles.frameworkTitle}>Purpose-to-Virtue Engine</Text>
          <Text style={styles.frameworkText}>
            Franklin transforms your audacious Purpose into daily Identity Metrics through gamified 
            Sub-Goals and micro-actions. Every action levels you up toward your ideal self.
          </Text>
          
          <View style={styles.frameworkSteps}>
            <View style={styles.frameworkStep}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.frameworkStepText}>Purpose drives 12-week Outcomes</Text>
            </View>
            <View style={styles.frameworkStep}>
              <Target size={16} color="#3B82F6" />
              <Text style={styles.frameworkStepText}>Outcomes break into daily Actions</Text>
            </View>
            <View style={styles.frameworkStep}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.frameworkStepText}>Actions award XP to Identity Areas</Text>
            </View>
          </View>
        </View>

        {purpose && (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              • Auto-import calendar & health data{'\n'}
              • Gap analysis between current & desired identity{'\n'}
              • Weekly OODA loop reviews{'\n'}
              • AI-powered insights & recommendations{'\n'}
              • Purpose progress visualization
            </Text>
          </View>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  demoTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginTop: 16,
    marginBottom: 8,
  },
  demoMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  ooodaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ooodaTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  ooodaSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ooodaStep: {
    flex: 1,
    alignItems: 'center',
  },
  ooodaStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ooodaStepTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 4,
  },
  ooodaStepText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  purposeForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    padding: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createButton: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 100,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  examplesContainer: {
    marginTop: 12,
  },
  examplesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  examplesScroll: {
    marginTop: 4,
  },
  exampleChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    width: 200,
  },
  exampleText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  readOnlyPurpose: {
    gap: 16,
  },
  purposeContent: {
    gap: 12,
  },
  purposeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    lineHeight: 28,
  },
  purposeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  purposeDate: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  purposeDateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  emptyPurpose: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  frameworkInfo: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  frameworkTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  frameworkText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4338CA',
    lineHeight: 20,
    marginBottom: 16,
  },
  frameworkSteps: {
    gap: 8,
  },
  frameworkStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frameworkStepText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4338CA',
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