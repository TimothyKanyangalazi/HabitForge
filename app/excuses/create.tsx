import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ExcuseForm } from '../../src/components/ExcuseCard/ExcuseForm';
import { useExcuseStore } from '../../src/stores/excuseStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function CreateExcuseScreen() {
  const { habitId, habitName } = useLocalSearchParams();
  const theme = useTheme();
  const { createExcuse } = useExcuseStore();

  const handleSubmit = async (values: any) => {
    try {
      await createExcuse({
        text: values.text,
        reality_check: values.reality_check,
        action_next_time: values.action_next_time,
        category: 'custom',
      });
      router.back();
    } catch (error) {
      console.error('Failed to create excuse:', error);
      alert('Failed to save excuse. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ExcuseForm
        habitId={habitId ? Number(habitId) : undefined}
        habitName={habitName as string}
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