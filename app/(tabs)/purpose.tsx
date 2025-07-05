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
import { useIdentityAreas } from '@/src/hooks/useIdentityAreas';
import { useOutcomes } from '@/src/hooks/useOutcomes';
import { useMicroActions } from '@/src/hooks/useMicroActions';
import { Mountain, Target, TrendingUp, Star, Plus, Edit3, Save, X, Compass, Flame, Eye, Brain, Zap, Calendar, BarChart3, Users, Lightbulb, AlertTriangle } from 'lucide-react-native';

type OODAPhase = 'orient' | 'observe' | 'decide' | 'act';

export default function PurposeScreen() {
  const { user, isConfigured } = useAuth();
  const { purpose, loading, error, createPurpose, updatePurpose, refetch } = usePurpose();
  const { identityAreas } = useIdentityAreas();
  const { outcomes } = useOutcomes();
  const { actions, dailyStats } = useMicroActions();
  
  const [activePhase, setActivePhase] = useState<OODAPhase>('orient');
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

  const getPhaseIcon = (phase: OODAPhase) => {
    switch (phase) {
      case 'orient': return Compass;
      case 'observe': return Eye;
      case 'decide': return Brain;
      case 'act': return Flame;
    }
  };

  const getPhaseColor = (phase: OODAPhase) => {
    switch (phase) {
      case 'orient': return '#3B82F6';
      case 'observe': return '#F59E0B';
      case 'decide': return '#8B5CF6';
      case 'act': return '#10B981';
    }
  };

  const getPhaseDescription = (phase: OODAPhase) => {
    switch (phase) {
      case 'orient': return 'See the Mountain & Name It';
      case 'observe': return 'Expose the Gaps';
      case 'decide': return 'Craft the Climb';
      case 'act': return 'Climb, Adapt, Repeat';
    }
  };

  const calculateIdentityGaps = () => {
    return identityAreas.map(area => {
      const areaOutcomes = outcomes.filter(o => o.identity_area_id === area.id && o.status === 'active');
      const areaActions = actions.filter(a => a.identity_area_id === area.id);
      const completedToday = areaActions.filter(a => a.completed_today).length;
      const completionRate = areaActions.length > 0 ? (completedToday / areaActions.length) * 100 : 0;
      
      let gapLevel: 'low' | 'medium' | 'high';
      if (completionRate >= 80) gapLevel = 'low';
      else if (completionRate >= 50) gapLevel = 'medium';
      else gapLevel = 'high';

      return {
        area,
        outcomes: areaOutcomes.length,
        actions: areaActions.length,
        completionRate,
        level: area.level || 0,
        xp: area.current_xp || 0,
        gapLevel,
        suggestions: getGapSuggestions(area, gapLevel)
      };
    });
  };

  const getGapSuggestions = (area: any, gapLevel: string) => {
    const suggestions = {
      'Health & Fitness': {
        high: ['Set up morning workout routine', 'Plan weekly meal prep', 'Track daily water intake'],
        medium: ['Add strength training', 'Improve sleep schedule', 'Try new healthy recipes'],
        low: ['Optimize recovery time', 'Advanced nutrition tracking', 'Performance metrics']
      },
      'Career & Growth': {
        high: ['Set learning goals', 'Network with industry peers', 'Update resume/portfolio'],
        medium: ['Take online courses', 'Seek mentor guidance', 'Practice new skills'],
        low: ['Lead projects', 'Speak at events', 'Coach others']
      }
    };

    return suggestions[area.name as keyof typeof suggestions]?.[gapLevel] || [
      'Define specific goals',
      'Create action plan',
      'Track progress daily'
    ];
  };

  const identityGaps = calculateIdentityGaps();

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
          <Text style={styles.demoTitle}>Purpose-to-Virtue Engine</Text>
          <Text style={styles.demoMessage}>
            Demo mode active. Configure Supabase to run your complete OODA loop and transform purpose into daily virtue.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOrientPhase = () => (
    <View style={styles.phaseContent}>
      {/* Current Reality Scan */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={18} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Current Reality Scan</Text>
        </View>
        <View style={styles.realityGrid}>
          <View style={styles.realityCard}>
            <Text style={styles.realityLabel}>Daily Actions</Text>
            <Text style={styles.realityValue}>{actions.length}</Text>
            <Text style={styles.realitySubtext}>Active</Text>
          </View>
          <View style={styles.realityCard}>
            <Text style={styles.realityLabel}>Completion Rate</Text>
            <Text style={styles.realityValue}>{dailyStats?.completion_rate || 0}%</Text>
            <Text style={styles.realitySubtext}>Today</Text>
          </View>
          <View style={styles.realityCard}>
            <Text style={styles.realityLabel}>Identity Areas</Text>
            <Text style={styles.realityValue}>{identityAreas.length}</Text>
            <Text style={styles.realitySubtext}>Active</Text>
          </View>
          <View style={styles.realityCard}>
            <Text style={styles.realityLabel}>Outcomes</Text>
            <Text style={styles.realityValue}>{outcomes.filter(o => o.status === 'active').length}</Text>
            <Text style={styles.realitySubtext}>12-week</Text>
          </View>
        </View>
        <View style={styles.integrationNote}>
          <Lightbulb size={16} color="#F59E0B" />
          <Text style={styles.integrationText}>
            Auto-import from calendar, health apps, and learning platforms coming soon
          </Text>
        </View>
      </View>

      {/* Purpose Declaration */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Mountain size={18} color="#991B1B" />
          <Text style={styles.sectionTitle}>Purpose Declaration</Text>
        </View>
        
        {(isEditing || !purpose) ? (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>What is your 10× Goal? *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What audacious goal excites and scares you?"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Why does this matter?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What will achieving this mean for you and others?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.actionButtons}>
              {isEditing && (
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <X size={16} color="#6B7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : purpose ? 'Update Purpose' : 'Set Purpose'}
                </Text>
              </TouchableOpacity>
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
          <View style={styles.purposeDisplay}>
            <View style={styles.purposeContent}>
              <Text style={styles.purposeTitle}>{purpose.title}</Text>
              {purpose.description && (
                <Text style={styles.purposeDescription}>{purpose.description}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createPurposeButton}
            onPress={() => setIsEditing(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createPurposeButtonText}>Define Your Purpose</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Identity Metrics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={18} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Identity Metrics</Text>
        </View>
        <View style={styles.identityMetrics}>
          {identityAreas.map((area) => (
            <View key={area.id} style={styles.identityMetricCard}>
              <View style={styles.identityMetricHeader}>
                <Text style={[styles.identityMetricName, { color: area.color }]}>
                  {area.name}
                </Text>
                <View style={styles.identityMetricLevel}>
                  <Text style={styles.identityMetricLevelText}>
                    Level {area.level || 0}
                  </Text>
                </View>
              </View>
              <View style={styles.identityMetricProgress}>
                <View style={styles.identityMetricXP}>
                  <Text style={styles.identityMetricXPText}>
                    {area.current_xp || 0} XP
                  </Text>
                </View>
                <View style={styles.identityMetricBar}>
                  <View 
                    style={[
                      styles.identityMetricBarFill,
                      { 
                        width: `${((area.current_xp || 0) % 100)}%`,
                        backgroundColor: area.color
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderObservePhase = () => (
    <View style={styles.phaseContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertTriangle size={18} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Gap Analysis</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Identify skill gaps, quality gaps, and resource constraints for each identity metric
        </Text>
        
        <View style={styles.gapAnalysis}>
          {identityGaps.map((gap) => (
            <View key={gap.area.id} style={styles.gapCard}>
              <View style={styles.gapHeader}>
                <Text style={[styles.gapAreaName, { color: gap.area.color }]}>
                  {gap.area.name}
                </Text>
                <View style={[
                  styles.gapLevelBadge,
                  gap.gapLevel === 'high' ? styles.gapHigh :
                  gap.gapLevel === 'medium' ? styles.gapMedium : styles.gapLow
                ]}>
                  <Text style={styles.gapLevelText}>
                    {gap.gapLevel.toUpperCase()} GAP
                  </Text>
                </View>
              </View>
              
              <View style={styles.gapStats}>
                <View style={styles.gapStat}>
                  <Text style={styles.gapStatLabel}>Outcomes</Text>
                  <Text style={styles.gapStatValue}>{gap.outcomes}</Text>
                </View>
                <View style={styles.gapStat}>
                  <Text style={styles.gapStatLabel}>Actions</Text>
                  <Text style={styles.gapStatValue}>{gap.actions}</Text>
                </View>
                <View style={styles.gapStat}>
                  <Text style={styles.gapStatLabel}>Completion</Text>
                  <Text style={styles.gapStatValue}>{Math.round(gap.completionRate)}%</Text>
                </View>
                <View style={styles.gapStat}>
                  <Text style={styles.gapStatLabel}>Level</Text>
                  <Text style={styles.gapStatValue}>{gap.level}</Text>
                </View>
              </View>

              <View style={styles.gapSuggestions}>
                <Text style={styles.gapSuggestionsTitle}>Suggested Actions:</Text>
                {gap.suggestions.slice(0, 2).map((suggestion, index) => (
                  <Text key={index} style={styles.gapSuggestion}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDecidePhase = () => (
    <View style={styles.phaseContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={18} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Craft the Climb</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Set 12-week outcomes for each identity metric that prove progress toward your purpose
        </Text>
        
        <View style={styles.outcomesPlan}>
          {identityAreas.map((area) => {
            const areaOutcomes = outcomes.filter(o => o.identity_area_id === area.id);
            const activeOutcomes = areaOutcomes.filter(o => o.status === 'active');
            
            return (
              <View key={area.id} style={styles.outcomesPlanCard}>
                <View style={styles.outcomesPlanHeader}>
                  <Text style={[styles.outcomesPlanTitle, { color: area.color }]}>
                    {area.name}
                  </Text>
                  <Text style={styles.outcomesPlanCount}>
                    {activeOutcomes.length} active outcome{activeOutcomes.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                {activeOutcomes.length > 0 ? (
                  activeOutcomes.map((outcome) => (
                    <View key={outcome.id} style={styles.outcomeItem}>
                      <Text style={styles.outcomeItemTitle} numberOfLines={2}>
                        {outcome.title}
                      </Text>
                      <View style={styles.outcomeItemProgress}>
                        <Text style={styles.outcomeItemProgressText}>
                          {outcome.progress_percentage}%
                        </Text>
                        <View style={styles.outcomeItemProgressBar}>
                          <View 
                            style={[
                              styles.outcomeItemProgressFill,
                              { 
                                width: `${outcome.progress_percentage}%`,
                                backgroundColor: area.color
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noOutcomes}>
                    <Text style={styles.noOutcomesText}>
                      No outcomes set for this identity area
                    </Text>
                    <Text style={styles.noOutcomesSuggestion}>
                      Create a 12-week outcome that moves you toward your purpose
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.planningFramework}>
          <Text style={styles.planningTitle}>Planning Framework</Text>
          <View style={styles.planningSteps}>
            <View style={styles.planningStep}>
              <View style={styles.planningStepNumber}>
                <Text style={styles.planningStepNumberText}>1</Text>
              </View>
              <Text style={styles.planningStepText}>
                Set 12-week Outcome for each Identity Metric
              </Text>
            </View>
            <View style={styles.planningStep}>
              <View style={styles.planningStepNumber}>
                <Text style={styles.planningStepNumberText}>2</Text>
              </View>
              <Text style={styles.planningStepText}>
                Break into 3-4 milestone checkpoints (25%, 50%, 75%, 100%)
              </Text>
            </View>
            <View style={styles.planningStep}>
              <View style={styles.planningStepNumber}>
                <Text style={styles.planningStepNumberText}>3</Text>
              </View>
              <Text style={styles.planningStepText}>
                Define clear pass/fail numbers and success minimums
              </Text>
            </View>
            <View style={styles.planningStep}>
              <View style={styles.planningStepNumber}>
                <Text style={styles.planningStepNumberText}>4</Text>
              </View>
              <Text style={styles.planningStepText}>
                Create daily micro-actions that compound toward milestones
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderActPhase = () => (
    <View style={styles.phaseContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Flame size={18} color="#10B981" />
          <Text style={styles.sectionTitle}>Daily Priority Board</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Today's top micro-steps tagged by identity metric
        </Text>

        <View style={styles.priorityBoard}>
          {identityAreas.map((area) => {
            const areaActions = actions.filter(a => a.identity_area_id === area.id);
            const completedToday = areaActions.filter(a => a.completed_today).length;
            
            if (areaActions.length === 0) return null;
            
            return (
              <View key={area.id} style={styles.priorityCard}>
                <View style={styles.priorityHeader}>
                  <Text style={[styles.priorityAreaName, { color: area.color }]}>
                    {area.name}
                  </Text>
                  <View style={styles.priorityStats}>
                    <Text style={styles.priorityCompletion}>
                      {completedToday}/{areaActions.length}
                    </Text>
                    <View style={[styles.priorityXP, { backgroundColor: area.color + '20' }]}>
                      <Star size={12} color={area.color} />
                      <Text style={[styles.priorityXPText, { color: area.color }]}>
                        Level {area.level || 0}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.priorityActions}>
                  {areaActions.slice(0, 3).map((action) => (
                    <View key={action.id} style={styles.priorityAction}>
                      <View style={[
                        styles.priorityActionCheck,
                        action.completed_today && styles.priorityActionCompleted
                      ]}>
                        {action.completed_today && (
                          <Text style={styles.priorityActionCheckmark}>✓</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.priorityActionTitle,
                        action.completed_today && styles.priorityActionTitleCompleted
                      ]}>
                        {action.title}
                      </Text>
                      <Text style={styles.priorityActionXP}>
                        +{action.xp_awarded || 10}
                      </Text>
                    </View>
                  ))}
                  {areaActions.length > 3 && (
                    <Text style={styles.priorityMoreActions}>
                      +{areaActions.length - 3} more actions
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.dailyFlow}>
          <Text style={styles.dailyFlowTitle}>Daily Flow</Text>
          <View style={styles.dailyFlowSteps}>
            <View style={styles.dailyFlowStep}>
              <View style={[styles.dailyFlowIcon, { backgroundColor: '#F59E0B20' }]}>
                <Target size={16} color="#F59E0B" />
              </View>
              <Text style={styles.dailyFlowStepTitle}>Morning Planning</Text>
              <Text style={styles.dailyFlowStepText}>
                Review priority board, set intentions
              </Text>
            </View>
            <View style={styles.dailyFlowStep}>
              <View style={[styles.dailyFlowIcon, { backgroundColor: '#10B98120' }]}>
                <Zap size={16} color="#10B981" />
              </View>
              <Text style={styles.dailyFlowStepTitle}>Execute Actions</Text>
              <Text style={styles.dailyFlowStepText}>
                Complete micro-steps, earn XP
              </Text>
            </View>
            <View style={styles.dailyFlowStep}>
              <View style={[styles.dailyFlowIcon, { backgroundColor: '#6366F120' }]}>
                <Calendar size={16} color="#6366F1" />
              </View>
              <Text style={styles.dailyFlowStepTitle}>Evening Reflect</Text>
              <Text style={styles.dailyFlowStepText}>
                Review progress, plan tomorrow
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const phaseData = [
    { phase: 'orient' as OODAPhase, title: 'ORIENT', description: 'See the Mountain & Name It' },
    { phase: 'observe' as OODAPhase, title: 'OBSERVE', description: 'Expose the Gaps' },
    { phase: 'decide' as OODAPhase, title: 'DECIDE', description: 'Craft the Climb' },
    { phase: 'act' as OODAPhase, title: 'ACT', description: 'Climb, Adapt, Repeat' },
  ];

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
          <Text style={styles.title}>Purpose-to-Virtue Engine</Text>
          <Text style={styles.subtitle}>
            Complete OODA loop running weekly cycles with daily micro-loops
          </Text>
        </View>

        {/* OODA Phase Navigator */}
        <View style={styles.phaseNavigator}>
          {phaseData.map((item) => {
            const Icon = getPhaseIcon(item.phase);
            const isActive = activePhase === item.phase;
            const color = getPhaseColor(item.phase);
            
            return (
              <TouchableOpacity
                key={item.phase}
                style={[
                  styles.phaseTab,
                  isActive && [styles.phaseTabActive, { backgroundColor: color + '20', borderColor: color }]
                ]}
                onPress={() => setActivePhase(item.phase)}
              >
                <Icon size={20} color={isActive ? color : '#6B7280'} />
                <Text style={[
                  styles.phaseTabTitle,
                  isActive && { color: color }
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.phaseTabDescription,
                  isActive && { color: color }
                ]}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Phase Content */}
        {activePhase === 'orient' && renderOrientPhase()}
        {activePhase === 'observe' && renderObservePhase()}
        {activePhase === 'decide' && renderDecidePhase()}
        {activePhase === 'act' && renderActPhase()}

        {/* Weekly Loop Info */}
        <View style={styles.weeklyLoop}>
          <Text style={styles.weeklyLoopTitle}>Weekly Full Loop</Text>
          <Text style={styles.weeklyLoopDescription}>
            Every Sunday evening, Franklin runs a complete OODA review to keep you on the right route
          </Text>
          <View style={styles.weeklyLoopSteps}>
            <Text style={styles.weeklyLoopStep}>• ORIENT Re-check: Any major life/context shifts?</Text>
            <Text style={styles.weeklyLoopStep}>• OBSERVE Trends: Completion %, Metric XP, new constraints</Text>
            <Text style={styles.weeklyLoopStep}>• DECIDE Adjustments: Raise/lower minimums, swap learning paths</Text>
            <Text style={styles.weeklyLoopStep}>• ACT Preview: Tomorrow's refreshed board goes live</Text>
          </View>
        </View>
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
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
  phaseNavigator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  phaseTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phaseTabActive: {
    borderWidth: 2,
  },
  phaseTabTitle: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  phaseTabDescription: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 10,
  },
  phaseContent: {
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  realityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  realityCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  realityLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  realityValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  realitySubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  integrationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  integrationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#991B1B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  examplesContainer: {
    marginTop: 12,
  },
  examplesTitle: {
    fontSize: 12,
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
    width: 180,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 14,
  },
  purposeDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  purposeContent: {
    flex: 1,
  },
  purposeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 6,
  },
  purposeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
  createPurposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  createPurposeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  identityMetrics: {
    gap: 8,
  },
  identityMetricCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  identityMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  identityMetricName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  identityMetricLevel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  identityMetricLevelText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  identityMetricProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityMetricXP: {
    minWidth: 40,
  },
  identityMetricXPText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  identityMetricBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  identityMetricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gapAnalysis: {
    gap: 12,
  },
  gapCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gapAreaName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  gapLevelBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  gapHigh: {
    backgroundColor: '#FEF2F2',
  },
  gapMedium: {
    backgroundColor: '#FEF3C7',
  },
  gapLow: {
    backgroundColor: '#ECFDF5',
  },
  gapLevelText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  gapStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gapStat: {
    alignItems: 'center',
  },
  gapStatLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  gapStatValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  gapSuggestions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  gapSuggestionsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  gapSuggestion: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 2,
  },
  outcomesPlan: {
    gap: 12,
  },
  outcomesPlanCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  outcomesPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomesPlanTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  outcomesPlanCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  outcomeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  outcomeItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  outcomeItemProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeItemProgressText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    minWidth: 32,
  },
  outcomeItemProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  outcomeItemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  noOutcomes: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noOutcomesText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  noOutcomesSuggestion: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  planningFramework: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  planningTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#0369A1',
    marginBottom: 12,
  },
  planningSteps: {
    gap: 8,
  },
  planningStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  planningStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0369A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planningStepNumberText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  planningStepText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    lineHeight: 16,
  },
  priorityBoard: {
    gap: 12,
  },
  priorityCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityAreaName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  priorityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityCompletion: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  priorityXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  priorityXPText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  priorityActions: {
    gap: 8,
  },
  priorityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  priorityActionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityActionCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  priorityActionCheckmark: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  priorityActionTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  priorityActionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  priorityActionXP: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  priorityMoreActions: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dailyFlow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  dailyFlowTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#166534',
    marginBottom: 12,
  },
  dailyFlowSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dailyFlowStep: {
    flex: 1,
    alignItems: 'center',
  },
  dailyFlowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyFlowStepTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#166534',
    marginBottom: 4,
    textAlign: 'center',
  },
  dailyFlowStepText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 12,
  },
  weeklyLoop: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  weeklyLoopTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  weeklyLoopDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4338CA',
    lineHeight: 20,
    marginBottom: 16,
  },
  weeklyLoopSteps: {
    gap: 6,
  },
  weeklyLoopStep: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#4338CA',
    lineHeight: 16,
  },
});