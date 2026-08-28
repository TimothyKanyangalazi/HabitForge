import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Routine } from '../../types';

interface RoutineCardProps {
  routine: Routine;
  onPress: () => void;
  onLongPress?: () => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onPress,
  onLongPress,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: routine.color || theme.colors.primary }]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={routine.icon as any} size={24} color="#fff" />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{routine.name}</Text>
        {routine.description && (
          <Text style={styles.description} numberOfLines={2}>
            {routine.description}
          </Text>
        )}
        <View style={styles.metaContainer}>
          {routine.start_time && (
            <Text style={styles.meta}>
              <Ionicons name="time-outline" size={12} color="#fff" /> {routine.start_time}
            </Text>
          )}
          <Text style={styles.meta}>
            <Ionicons name="list-outline" size={12} color="#fff" /> Tasks
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#fff" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});