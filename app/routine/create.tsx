import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { RoutineForm } from '../../src/components/RoutineCard/RoutineForm';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function CreateRoutineScreen() {
  const theme = useTheme();
  const { createRoutine, addTask } = useRoutineStore();

  const handleSubmit = async (values: any) => {
    try {
      const { tasks, ...routineData } = values;
      const routineId = await createRoutine(routineData);
      
      // Add tasks
      for (const task of tasks) {
        await addTask({
          routine_id: routineId,
          task_name: task.task_name,
          order_index: task.order_index,
          duration_minutes: task.duration_minutes,
        });
      }
      
      router.back();
    } catch (error) {
      console.error('Failed to create routine:', error);
      alert('Failed to create routine. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RoutineForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});