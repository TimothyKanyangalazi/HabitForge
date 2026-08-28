import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Achievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  onPress?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  unlocked,
  unlockedAt,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          opacity: unlocked ? 1 : 0.6,
        },
      ]}
    >
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: unlocked 
            ? theme.colors.warning + '20' 
            : theme.colors.border,
        },
      ]}>
        <Ionicons 
          name={unlocked ? (achievement.icon as any) : 'lock-closed'} 
          size={28} 
          color={unlocked ? theme.colors.warning : theme.colors.textSecondary} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {achievement.name}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {achievement.description}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={[styles.xpBadge, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="star" size={12} color={theme.colors.primary} />
            <Text style={[styles.xpText, { color: theme.colors.primary }]}>
              +{achievement.xp_reward} XP
            </Text>
          </View>
          
          {unlocked && unlockedAt && (
            <Text style={[styles.unlockedDate, { color: theme.colors.textSecondary }]}>
              {new Date(unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      {unlocked && (
        <View style={[styles.unlockedBadge, { backgroundColor: theme.colors.success }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unlockedDate: {
    fontSize: 11,
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});