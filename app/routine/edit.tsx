import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { RoutineForm } from '../../src/components/RoutineCard/RoutineForm';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { currentRoutine, fetchRoutineById, updateRoutine, addTask, deleteTask } = useRoutineStore();

  useEffect(() => {
    if (id) {
      fetchRoutineById(Number(id));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    try {
      const { tasks, ...routineData } = values;
      await updateRoutine(Number(id), routineData);
      
      // Update tasks - simple approach: delete all and re-add
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
      
      router.back();
    } catch (error) {
      console.error('Failed to update routine:', error);
      alert('Failed to update routine. Please try again.');
    }
  };

  if (!currentRoutine) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RoutineForm
        initialValues={currentRoutine}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});