import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../../src/components/common/PrimaryButton';
import { SelectionCard } from '../../src/components/common/SelectionCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { useSettingsStore } from '../../src/stores/settingsStore';

const GOALS = [
  { title: 'Build Discipline', icon: 'shield-checkmark', color: '#4A90E2' },
  { title: 'Improve Health', icon: 'fitness', color: '#4CAF50' },
  { title: 'Learn Skills', icon: 'book', color: '#2196F3' },
  { title: 'Be Productive', icon: 'briefcase', color: '#FF9800' },
  { title: 'Practice Mindfulness', icon: 'leaf', color: '#9C27B0' },
  { title: 'Manage Time', icon: 'time', color: '#F44336' },
];

const HABITS = [
  'Wake up early',
  'Exercise',
  'Read 20 pages',
  'Meditate',
  'Drink water',
  'Journal',
  'Study',
  'Code',
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { completeOnboarding, updateSettings } = useSettingsStore();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const toggleHabit = (habit: string) => {
    setSelectedHabits(prev =>
      prev.includes(habit)
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedGoals.length === 0) {
        Alert.alert('Select Goals', 'Please select at least one goal to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    try {
      // Save preferences
      await updateSettings({
        notificationsEnabled: true,
        dailyReminderTime: '08:00',
      });
      
      // Mark onboarding as complete
      await completeOnboarding();
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              What are your goals?
            </Text>
            <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
              Select all that apply
            </Text>
            <ScrollView style={styles.scrollView}>
              {GOALS.map(goal => (
                <SelectionCard
                  key={goal.title}
                  title={goal.title}
                  icon={goal.icon}
                  color={goal.color}
                  selected={selectedGoals.includes(goal.title)}
                  onPress={() => toggleGoal(goal.title)}
                />
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Choose habits to start with
            </Text>
            <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
              You can add more later
            </Text>
            <ScrollView style={styles.scrollView}>
              {HABITS.map(habit => (
                <SelectionCard
                  key={habit}
                  title={habit}
                  selected={selectedHabits.includes(habit)}
                  onPress={() => toggleHabit(habit)}
                />
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              You're all set! 🎉
            </Text>
            <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>
              Here's what you selected:
            </Text>
            
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                Goals:
              </Text>
              {selectedGoals.map(goal => (
                <Text key={goal} style={[styles.summaryItem, { color: theme.colors.textSecondary }]}>
                  • {goal}
                </Text>
              ))}
              
              {selectedHabits.length > 0 && (
                <>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text, marginTop: 16 }]}>
                    Initial Habits:
                  </Text>
                  {selectedHabits.map(habit => (
                    <Text key={habit} style={[styles.summaryItem, { color: theme.colors.textSecondary }]}>
                      • {habit}
                    </Text>
                  ))}
                </>
              )}
            </View>

            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Tip: Start small and be consistent. You can always adjust your habits later.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.progressContainer}>
        {[1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= step ? theme.colors.primary : '#ddd',
                width: i === step ? 32 : 8,
              },
            ]}
          />
        ))}
      </View>

      {renderStep()}

      <View style={styles.buttonContainer}>
        {step < 3 ? (
          <PrimaryButton title="Next" onPress={handleNext} style={styles.button} />
        ) : (
          <PrimaryButton title="Start Tracking" onPress={handleFinish} style={styles.button} />
        )}
        
        {step > 1 && (
          <PrimaryButton
            title="Back"
            onPress={() => setStep(step - 1)}
            style={[styles.button, styles.backButton]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 16,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#666',
  },
});