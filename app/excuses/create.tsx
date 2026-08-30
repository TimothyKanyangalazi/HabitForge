import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExcuseForm } from '../../src/components/ExcuseCard/ExcuseForm';
import { useExcuseStore } from '../../src/stores/excuseStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

export default function CreateExcuseScreen() {
  const { habitId, habitName } = useLocalSearchParams();
  const router = useRouter();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const { createExcuse } = useExcuseStore();

  const handleSubmit = async (values: any) => {
    try {
      await createExcuse({
        text: values.text,
        reality_check: values.reality_check,
        action_next_time: values.action_next_time,
        category: 'custom',
      });
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/excuses');
      }
    } catch (error) {
      console.error('Failed to create excuse:', error);
      alert('Failed to save excuse. Please try again.');
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/excuses');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ExcuseForm
        habitId={habitId ? Number(habitId) : undefined}
        habitName={habitName as string}
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