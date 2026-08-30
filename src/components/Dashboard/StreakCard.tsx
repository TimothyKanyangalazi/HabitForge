import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  bestStreak,
}) => {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;

  return (
    <View style={[styles.card, { backgroundColor: colors.warning + '15' }]}>
      <View style={styles.flameContainer}>
        <Ionicons name="flame" size={48} color={colors.warning} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.streakNumber, { color: colors.warning }]}>
          {currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: colors.text }]}>
          Day Streak
        </Text>
        <Text style={[styles.bestStreak, { color: colors.textSecondary }]}>
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