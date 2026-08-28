import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { HabitForm } from '../../src/components/HabitCard/HabitForm';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Habit } from '../../src/types';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { habits, updateHabit } = useHabitStore();
  const [habit, setHabit] = useState<Habit | null>(null);

  useEffect(() => {
    const habitId = Number(id);
    const found = habits.find(h => h.id === habitId);
    setHabit(found || null);
  }, [id, habits]);

  const handleSubmit = async (values: any) => {
    try {
      await updateHabit(Number(id), values);
      router.back();
    } catch (error) {
      console.error('Failed to update habit:', error);
      alert('Failed to update habit. Please try again.');
    }
  };

  if (!habit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HabitForm
        initialValues={habit}
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