import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { HabitForm } from '../../src/components/HabitCard/HabitForm';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function CreateHabitScreen() {
  const theme = useTheme();
  const { createHabit } = useHabitStore();

  const handleSubmit = async (values: any) => {
    try {
      await createHabit(values);
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
      alert('Failed to create habit. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HabitForm
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