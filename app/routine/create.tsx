import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { RoutineForm } from '../../src/components/RoutineCard/RoutineForm';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const { createRoutine, addTask } = useRoutineStore();

  const handleSubmit = async (values: any) => {
    try {
      const { tasks, ...routineData } = values;
      const routineId = await createRoutine(routineData);
      
      for (const task of tasks) {
        await addTask({
          routine_id: routineId,
          task_name: task.task_name,
          order_index: task.order_index,
          duration_minutes: task.duration_minutes,
        });
      }
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/routines');
      }
    } catch (error) {
      console.error('Failed to create routine:', error);
      alert('Failed to create routine. Please try again.');
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/routines');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RoutineForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});