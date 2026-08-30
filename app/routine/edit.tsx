import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Animated, 
  Easing,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoutineForm } from '../../src/components/RoutineCard/RoutineForm';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { currentRoutine, fetchRoutineById, updateRoutine, addTask, deleteTask } = useRoutineStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (id) {
      fetchRoutineById(Number(id));
    }
    animateIn();
  }, [id]);

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
      const { tasks, ...routineData } = values;
      await updateRoutine(Number(id), routineData);
      
      if (currentRoutine) {
        for (const task of currentRoutine.tasks) {
          await deleteTask(task.id);
        }
        
        for (const task of tasks) {
          await addTask({
            routine_id: Number(id),
            task_name: task.task_name,
            order_index: task.order_index,
            duration_minutes: task.duration_minutes,
          });
        }
      }
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/routines');
      }
    } catch (error) {
      console.error('Failed to update routine:', error);
      alert('Failed to update routine. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/routines');
    }
  };

  if (!currentRoutine) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
          <Ionicons name="pencil" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading routine...
        </Text>
      </View>
    );
  }

  const totalTasks = currentRoutine.tasks.length;
  const totalDuration = currentRoutine.tasks.reduce((sum, task) => sum + (task.duration_minutes || 0), 0);

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
          {/* Routine Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            <View style={[styles.previewIcon, { backgroundColor: currentRoutine.color + '20' }]}>
              <Ionicons name={currentRoutine.icon as any} size={24} color={currentRoutine.color} />
            </View>
            <View style={styles.previewContent}>
              <Text style={[styles.previewName, { color: colors.text }]}>
                {currentRoutine.name}
              </Text>
              <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
                {totalTasks} tasks • {totalDuration} min
              </Text>
            </View>
            <View style={[styles.previewBadge, { backgroundColor: currentRoutine.color + '15' }]}>
              <Ionicons name="pencil" size={12} color={currentRoutine.color} />
              <Text style={[styles.previewBadgeText, { color: currentRoutine.color }]}>
                Editing
              </Text>
            </View>
          </View>

          {/* Form Component */}
          <RoutineForm
            initialValues={currentRoutine}
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
    marginHorizontal: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '600' },
});