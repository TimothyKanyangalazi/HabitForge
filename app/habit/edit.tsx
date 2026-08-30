import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Animated, 
  Easing, 
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HabitForm } from '../../src/components/HabitCard/HabitForm';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { Habit } from '../../src/types';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { habits, updateHabit } = useHabitStore();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const habitId = Number(id);
    const found = habits.find(h => h.id === habitId);
    setHabit(found || null);
    animateIn();
  }, [id, habits]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async (values: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await updateHabit(Number(id), values);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/habits');
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
      alert('Failed to update habit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/habits');
    }
  };

  if (!habit) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
          <Ionicons name="pencil" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading habit...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Habit Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            <View style={[styles.previewIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={habit.icon as any} size={24} color={colors.primary} />
            </View>
            <View style={styles.previewContent}>
              <Text style={[styles.previewName, { color: colors.text }]}>
                {habit.name}
              </Text>
              <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
                {habit.frequency_type} • {habit.target_count}x daily
              </Text>
            </View>
            <View style={[styles.previewBadge, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.previewBadgeText, { color: colors.primary }]}>
                Editing
              </Text>
            </View>
          </View>

          {/* Form Component */}
          <HabitForm
            initialValues={habit}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  formContainer: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingTop: 60 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  previewMeta: { fontSize: 12 },
  previewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '600' },
});