import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Habit, HabitLog } from '../../types';
import { lightTheme } from '../../theme';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onPress: () => void;
  onComplete: () => void;
  onLongPress?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  onPress,
  onComplete,
  onLongPress,
}) => {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const isCompleted = log?.status === 'completed';
  const isMissed = log?.status === 'missed';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={habit.icon as any} size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {habit.name}
        </Text>
        {habit.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {habit.description}
          </Text>
        )}
        <View style={styles.metaContainer}>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            {habit.frequency_type}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            Target: {habit.target_count}x
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onComplete}
        style={[
          styles.checkButton,
          {
            backgroundColor: isCompleted
              ? theme.colors.success
              : isMissed
              ? theme.colors.danger
              : '#ddd',
          },
        ]}
      >
        <Ionicons
          name={isCompleted ? 'checkmark' : isMissed ? 'close' : 'ellipse-outline'}
          size={24}
          color="#fff"
        />
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 12,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});