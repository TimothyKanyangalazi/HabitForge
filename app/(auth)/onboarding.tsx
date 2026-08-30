import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

const { width } = Dimensions.get('window');

const GOALS = [
  { title: 'Build Discipline', icon: 'shield-checkmark', color: '#4A90E2', description: 'Stay consistent daily' },
  { title: 'Improve Health', icon: 'fitness', color: '#4CAF50', description: 'Exercise and wellness' },
  { title: 'Learn Skills', icon: 'book', color: '#2196F3', description: 'Grow your knowledge' },
  { title: 'Be Productive', icon: 'briefcase', color: '#FF9800', description: 'Get things done' },
  { title: 'Practice Mindfulness', icon: 'leaf', color: '#9C27B0', description: 'Find inner peace' },
];

export default function OnboardingScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const { completeOnboarding, updateSettings } = useSettingsStore();
  
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const goalAnimations = useRef(GOALS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Main entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Title animation
    Animated.spring(titleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Staggered goal animations
    Animated.stagger(100, 
      goalAnimations.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();

    // Button animation
    Animated.spring(buttonAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

 const handleFinish = async () => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    // Save preferences first
    await updateSettings({
      notificationsEnabled: true,
      dailyReminderTime: '08:00',
      onboardingCompleted: true, // Also set it here
    });
    
    // Then explicitly complete onboarding
    await completeOnboarding();
    
    console.log('✅ Onboarding completed, navigating to tabs');
    
    // Navigate to tabs
    router.replace('/(tabs)');
  } catch (error) {
    console.error('❌ Error completing onboarding:', error);
    setIsSubmitting(false);
    Alert.alert('Error', 'Failed to save preferences.');
  }
};

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background decoration */}
      <View style={[styles.bgCircle, { backgroundColor: colors.primary + '08' }]} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          
          {/* Progress Dots */}
          <View style={styles.progressDots}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i <= step ? colors.primary : colors.border,
                    width: i === step ? 32 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Title Section */}
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            What are your goals?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select all that apply to personalize your experience
          </Text>
        </Animated.View>

        {/* Goals List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {GOALS.map((goal, index) => {
            const isSelected = selectedGoals.includes(goal.title);
            const goalAnim = goalAnimations[index];
            
            return (
              <Animated.View
                key={goal.title}
                style={{
                  opacity: goalAnim,
                  transform: [
                    {
                      translateX: goalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    },
                    {
                      scale: goalAnim,
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={() => toggleGoal(goal.title)}
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      backgroundColor: isSelected ? colors.primary + '15' : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      elevation: isSelected ? 3 : 1,
                      shadowColor: isSelected ? colors.primary : '#000',
                      shadowOpacity: isSelected ? 0.2 : 0.05,
                      shadowRadius: isSelected ? 6 : 2,
                      shadowOffset: { width: 0, height: 2 },
                    },
                  ]}
                >
                  <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                    <Ionicons name={goal.icon as any} size={24} color={goal.color} />
                  </View>
                  
                  <View style={styles.goalContent}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.goalDescription, { color: colors.textSecondary }]}>
                      {goal.description}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Ionicons name="add" size={16} color={colors.textSecondary} />
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Selected Count */}
        <View style={styles.selectedCountContainer}>
          <Ionicons name="ribbon" size={14} color={colors.primary} />
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {selectedGoals.length} {selectedGoals.length === 1 ? 'goal' : 'goals'} selected
          </Text>
        </View>

        {/* Button */}
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: buttonAnim,
              },
            ],
          }}
        >
          <Pressable
            onPress={handleFinish}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.finishButton,
              { 
                opacity: pressed || isSubmitting ? 0.8 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.finishButtonText}>
                {isSubmitting ? 'Setting Up...' : selectedGoals.length > 0 ? 'Start Tracking' : 'Skip for Now'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 6,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  finishButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});