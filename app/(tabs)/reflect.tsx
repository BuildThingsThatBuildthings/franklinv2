import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { useReflections } from '@/src/hooks/useReflections';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Sun, 
  Moon, 
  Star, 
  Lightbulb, 
  Heart, 
  Target,
  TrendingUp,
  Smile,
  Battery,
  BookOpen,
  Plus,
  Edit3,
  Save,
  X
} from 'lucide-react-native';

type ReflectionType = 'morning' | 'evening' | 'weekly';

export default function ReflectScreen() {
  const { user, isConfigured } = useAuth();
  const { 
    reflections, 
    todayReflection, 
    loading, 
    error, 
    createReflection, 
    updateReflection,
    fetchTodayReflection,
    getReflectionStats,
    refetch 
  } = useReflections();

  const [selectedType, setSelectedType] = useState<ReflectionType>('evening');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    overall_mood: 3,
    energy_level: 3,
    top_win: '',
    biggest_challenge: '',
    learning: '',
    gratitude: '',
    tomorrow_intention: '',
    identity_progress_notes: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (todayReflection) {
      setFormData({
        overall_mood: todayReflection.overall_mood || 3,
        energy_level: todayReflection.energy_level || 3,
        top_win: todayReflection.top_win || '',
        biggest_challenge: todayReflection.biggest_challenge || '',
        learning: todayReflection.learning || '',
        gratitude: todayReflection.gratitude || '',
        tomorrow_intention: todayReflection.tomorrow_intention || '',
        identity_progress_notes: todayReflection.identity_progress_notes || '',
      });
    } else {
      setFormData({
        overall_mood: 3,
        energy_level: 3,
        top_win: '',
        biggest_challenge: '',
        learning: '',
        gratitude: '',
        tomorrow_intention: '',
        identity_progress_notes: '',
      });
    }
  }, [todayReflection, selectedType]);

  React.useEffect(() => {
    fetchTodayReflection(selectedType);
  }, [selectedType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await fetchTodayReflection(selectedType);
    setRefreshing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const reflectionData = {
      ...formData,
      type: selectedType,
    };

    let result;
    if (todayReflection) {
      result = await updateReflection(todayReflection.id, reflectionData);
    } else {
      result = await createReflection(reflectionData);
    }

    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      setIsEditing(false);
      Alert.alert('Success', 'Reflection saved successfully!');
    }
    
    setSaving(false);
  };

  const renderRatingSelector = (value: number, onChange: (value: number) => void, icon: any) => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          style={[
            styles.ratingButton,
            value === rating && styles.ratingButtonSelected
          ]}
          onPress={() => onChange(rating)}
        >
          {React.createElement(icon, {
            size: 20,
            color: value === rating ? '#FFFFFF' : '#6B7280'
          })}
          <Text style={[
            styles.ratingText,
            value === rating && styles.ratingTextSelected
          ]}>
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getTypeIcon = (type: ReflectionType) => {
    switch (type) {
      case 'morning':
        return <Sun size={16} color="#F59E0B" />;
      case 'evening':
        return <Moon size={16} color="#6366F1" />;
      case 'weekly':
        return <Calendar size={16} color="#8B5CF6" />;
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const stats = getReflectionStats();

  if (!isConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.demoContainer}>
          <Calendar size={48} color="#D1D5DB" />
          <Text style={styles.demoTitle}>Daily Reflection</Text>
          <Text style={styles.demoMessage}>
            Demo mode active. Configure Supabase to enable reflection tracking and sync.
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
          <Text style={styles.title}>Daily Reflection</Text>
          <Text style={styles.subtitle}>
            {getTimeOfDay() === 'morning' 
              ? 'Start your day with intention' 
              : 'Review your progress and insights'
            }
          </Text>
        </View>

        {/* Stats Overview */}
        {reflections.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
                  <BookOpen size={20} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{stats.totalReflections}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{stats.thisWeekReflections}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Smile size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{stats.avgMood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Battery size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.statValue}>{stats.avgEnergy.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Energy</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reflection Type Selector */}
        <View style={styles.typeSelector}>
          {(['morning', 'evening', 'weekly'] as ReflectionType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonSelected
              ]}
              onPress={() => setSelectedType(type)}
            >
              {getTypeIcon(type)}
              <Text style={[
                styles.typeButtonText,
                selectedType === type && styles.typeButtonTextSelected
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reflection Form */}
        <View style={styles.reflectionForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {todayReflection ? 'Today\'s' : 'Create'} {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Reflection
            </Text>
            {todayReflection && !isEditing && (
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
                  onPress={() => setIsEditing(false)}
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
            {!todayReflection && (
              <TouchableOpacity
                style={[styles.createButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {(isEditing || !todayReflection) ? (
            <>
              {/* Mood and Energy */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Smile size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Overall Mood</Text>
                </View>
                {renderRatingSelector(formData.overall_mood, (value) => 
                  setFormData(prev => ({ ...prev, overall_mood: value })), Smile
                )}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Battery size={18} color="#8B5CF6" />
                  <Text style={styles.sectionTitle}>Energy Level</Text>
                </View>
                {renderRatingSelector(formData.energy_level, (value) => 
                  setFormData(prev => ({ ...prev, energy_level: value })), Battery
                )}
              </View>

              {/* Text Fields */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Top Win</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={formData.top_win}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, top_win: text }))}
                  placeholder="What was your biggest win today?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Target size={18} color="#EF4444" />
                  <Text style={styles.sectionTitle}>Biggest Challenge</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={formData.biggest_challenge}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, biggest_challenge: text }))}
                  placeholder="What was your biggest challenge?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Lightbulb size={18} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Learning</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={formData.learning}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, learning: text }))}
                  placeholder="What did you learn today?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Heart size={18} color="#EC4899" />
                  <Text style={styles.sectionTitle}>Gratitude</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={formData.gratitude}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, gratitude: text }))}
                  placeholder="What are you grateful for?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {selectedType === 'evening' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Sun size={18} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Tomorrow's Intention</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={formData.tomorrow_intention}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tomorrow_intention: text }))}
                    placeholder="What's your intention for tomorrow?"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>Identity Progress</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={formData.identity_progress_notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, identity_progress_notes: text }))}
                  placeholder="How did you embody your ideal identity today?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          ) : todayReflection ? (
            <View style={styles.readOnlyReflection}>
              <View style={styles.moodEnergyDisplay}>
                <View style={styles.moodEnergyItem}>
                  <Smile size={16} color="#F59E0B" />
                  <Text style={styles.moodEnergyLabel}>Mood</Text>
                  <Text style={styles.moodEnergyValue}>{todayReflection.overall_mood}/5</Text>
                </View>
                <View style={styles.moodEnergyItem}>
                  <Battery size={16} color="#8B5CF6" />
                  <Text style={styles.moodEnergyLabel}>Energy</Text>
                  <Text style={styles.moodEnergyValue}>{todayReflection.energy_level}/5</Text>
                </View>
              </View>

              {todayReflection.top_win && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <Star size={16} color="#F59E0B" />
                    <Text style={styles.reflectionItemTitle}>Top Win</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.top_win}</Text>
                </View>
              )}

              {todayReflection.biggest_challenge && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <Target size={16} color="#EF4444" />
                    <Text style={styles.reflectionItemTitle}>Biggest Challenge</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.biggest_challenge}</Text>
                </View>
              )}

              {todayReflection.learning && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <Lightbulb size={16} color="#3B82F6" />
                    <Text style={styles.reflectionItemTitle}>Learning</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.learning}</Text>
                </View>
              )}

              {todayReflection.gratitude && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <Heart size={16} color="#EC4899" />
                    <Text style={styles.reflectionItemTitle}>Gratitude</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.gratitude}</Text>
                </View>
              )}

              {todayReflection.tomorrow_intention && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <Sun size={16} color="#F59E0B" />
                    <Text style={styles.reflectionItemTitle}>Tomorrow's Intention</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.tomorrow_intention}</Text>
                </View>
              )}

              {todayReflection.identity_progress_notes && (
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionItemHeader}>
                    <TrendingUp size={16} color="#10B981" />
                    <Text style={styles.reflectionItemTitle}>Identity Progress</Text>
                  </View>
                  <Text style={styles.reflectionItemText}>{todayReflection.identity_progress_notes}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyReflection}>
              <Calendar size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No reflection yet</Text>
              <Text style={styles.emptyMessage}>
                Take a moment to reflect on your day and capture your insights.
              </Text>
            </View>
          )}
        </View>

        {/* Past Reflections */}
        {reflections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reflections</Text>
            <View style={styles.reflectionsList}>
              {reflections.slice(0, 5).map((reflection) => (
                <View key={reflection.id} style={styles.reflectionSummary}>
                  <View style={styles.reflectionSummaryHeader}>
                    <View style={styles.reflectionSummaryDate}>
                      {getTypeIcon(reflection.type as ReflectionType)}
                      <Text style={styles.reflectionSummaryDateText}>
                        {new Date(reflection.reflection_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.reflectionSummaryRatings}>
                      <View style={styles.ratingDisplay}>
                        <Smile size={12} color="#F59E0B" />
                        <Text style={styles.ratingDisplayText}>{reflection.overall_mood || '-'}</Text>
                      </View>
                      <View style={styles.ratingDisplay}>
                        <Battery size={12} color="#8B5CF6" />
                        <Text style={styles.ratingDisplayText}>{reflection.energy_level || '-'}</Text>
                      </View>
                    </View>
                  </View>
                  {reflection.top_win && (
                    <Text style={styles.reflectionSummaryText} numberOfLines={2}>
                      {reflection.top_win}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {reflections.length > 0 && (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              • Mood and energy trends{'\n'}
              • Weekly reflection summaries{'\n'}
              • Reflection insights and patterns{'\n'}
              • Goal progress correlation{'\n'}
              • Mindfulness integration
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
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  typeButtonSelected: {
    backgroundColor: '#6366F1',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
  reflectionForm: {
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
    fontSize: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  ratingButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  ratingTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  readOnlyReflection: {
    gap: 16,
  },
  moodEnergyDisplay: {
    flexDirection: 'row',
    gap: 16,
  },
  moodEnergyItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  moodEnergyLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  moodEnergyValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  reflectionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  reflectionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reflectionItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  reflectionItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyReflection: {
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
  },
  reflectionsList: {
    gap: 12,
  },
  reflectionSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reflectionSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reflectionSummaryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reflectionSummaryDateText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  reflectionSummaryRatings: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingDisplayText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  reflectionSummaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
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