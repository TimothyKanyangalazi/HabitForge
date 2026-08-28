import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { habitService } from '../../src/services/habitService';
import { Habit, HabitLog } from '../../src/types';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { habits, deleteHabit, archiveHabit } = useHabitStore();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    loadHabit();
  }, [id]);

  const loadHabit = async () => {
    const habitId = Number(id);
    const foundHabit = habits.find(h => h.id === habitId);
    if (foundHabit) {
      setHabit(foundHabit);
    } else {
      const fetched = await habitService.fetchById(habitId);
      setHabit(fetched);
    }

    const habitLogs = await habitService.getLogsByHabit(habitId);
    setLogs(habitLogs);
  };

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const completionRate = logs.length > 0
    ? (logs.filter(l => l.status === 'completed').length / logs.length) * 100
    : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={habit.icon as any} size={32} color="#fff" />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>{habit.name}</Text>
        {habit.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {habit.description}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {logs.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Days
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {completionRate.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Success Rate
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {habit.target_count}x
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Daily Target
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          onPress={() => router.push(`/habit/edit?id=${habit.id}`)}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => archiveHabit(habit.id)}
          style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
        >
          <Ionicons name="archive" size={20} color="#fff" />
          <Text style={styles.actionText}>Archive</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            deleteHabit(habit.id);
            router.back();
          }}
          style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.historySection}>
        <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
          Recent History
        </Text>
        {logs.slice(0, 10).map(log => (
          <View key={log.id} style={[styles.logItem, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.logDate, { color: theme.colors.text }]}>
              {log.log_date}
            </Text>
            <View style={[styles.logStatus, { backgroundColor: 
              log.status === 'completed' ? theme.colors.success : 
              log.status === 'missed' ? theme.colors.danger : '#ddd'
            }]}>
              <Text style={styles.logStatusText}>{log.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '500',
  },
  historySection: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
  },
  logStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});