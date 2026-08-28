import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { 
    currentRoutine, 
    todayLogs, 
    fetchRoutineById, 
    fetchTodayLogs,
    logTask,
    deleteRoutine,
    archiveRoutine 
  } = useRoutineStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  useEffect(() => {
    if (currentRoutine && todayLogs) {
      const totalTasks = currentRoutine.tasks.length;
      const completedTasks = currentRoutine.tasks.filter(
        task => todayLogs[task.id]?.status === 'completed'
      ).length;
      setProgress(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
    }
  }, [currentRoutine, todayLogs]);

  const loadRoutine = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([
      fetchRoutineById(Number(id)),
      fetchTodayLogs(today)
    ]);
  };

  const handleTaskToggle = async (taskId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const currentLog = todayLogs[taskId];
    
    let newStatus: 'completed' | 'missed' | 'skipped' = 'completed';
    if (currentLog?.status === 'completed') {
      newStatus = 'missed';
    }

    try {
      await logTask({
        routine_task_id: taskId,
        log_date: today,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update task.');
    }
  };

  if (!currentRoutine) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentRoutine.color || theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <Ionicons name={currentRoutine.icon as any} size={48} color="#fff" />
          <Text style={styles.routineName}>{currentRoutine.name}</Text>
          {currentRoutine.description && (
            <Text style={styles.routineDescription}>{currentRoutine.description}</Text>
          )}
          {currentRoutine.start_time && (
            <Text style={styles.startTime}>
              <Ionicons name="time-outline" size={16} color="#fff" /> {currentRoutine.start_time}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
            Today's Progress
          </Text>
          <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: `${progress}%` 
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.tasksSection}>
        <Text style={[styles.tasksTitle, { color: theme.colors.text }]}>
          Tasks
        </Text>
        {currentRoutine.tasks.map((task, index) => {
          const log = todayLogs[task.id];
          const isCompleted = log?.status === 'completed';
          
          return (
            <Pressable
              key={task.id}
              onPress={() => handleTaskToggle(task.id)}
              style={[styles.taskItem, { backgroundColor: theme.colors.card }]}
            >
              <View style={[
                styles.taskCheckbox,
                { 
                  backgroundColor: isCompleted ? theme.colors.success : 'transparent',
                  borderColor: isCompleted ? theme.colors.success : theme.colors.border,
                }
              ]}>
                {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              
              <View style={styles.taskContent}>
                <Text style={[
                  styles.taskName, 
                  { 
                    color: theme.colors.text,
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
                  }
                ]}>
                  {index + 1}. {task.task_name}
                </Text>
                <Text style={[styles.taskDuration, { color: theme.colors.textSecondary }]}>
                  {task.duration_minutes} minutes
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          onPress={() => router.push(`/routine/edit?id=${currentRoutine.id}`)}
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => archiveRoutine(currentRoutine.id)}
          style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
        >
          <Ionicons name="archive" size={20} color="#fff" />
          <Text style={styles.actionText}>Archive</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Routine',
              'Are you sure you want to delete this routine?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    deleteRoutine(currentRoutine.id);
                    router.back();
                  }
                }
              ]
            );
          }}
          style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
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
    padding: 24,
    paddingTop: 60,
  },
  headerContent: {
    alignItems: 'center',
  },
  routineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  routineDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  startTime: {
    fontSize: 14,
    color: '#fff',
  },
  progressSection: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tasksSection: {
    padding: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    marginBottom: 4,
  },
  taskDuration: {
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
});