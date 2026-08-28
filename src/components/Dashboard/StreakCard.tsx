import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  bestStreak,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.warning + '15' }]}>
      <View style={styles.flameContainer}>
        <Ionicons name="flame" size={48} color={theme.colors.warning} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.streakNumber, { color: theme.colors.warning }]}>
          {currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: theme.colors.text }]}>
          Day Streak
        </Text>
        <Text style={[styles.bestStreak, { color: theme.colors.textSecondary }]}>
          Best: {bestStreak} days
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  flameContainer: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  bestStreak: {
    fontSize: 13,
  },
});