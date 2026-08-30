import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useRouter } from 'expo-router';
import { HabitForm } from '../../src/components/HabitCard/HabitForm';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

export default function CreateHabitScreen() {
  const router = useRouter();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
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

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/habits');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HabitForm
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