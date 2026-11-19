import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { ProgressRing } from '../../src/components/Dashboard/ProgressRing';
import { notificationService } from '../../src/services/notificationService';

interface ActiveRoutineTask {
  taskIndex: number;
  endsAt: number;
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

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
  const [activeTask, setActiveTask] = useState<ActiveRoutineTask | null>(null);
  const [now, setNow] = useState(Date.now());
  const notificationId = useRef<string | null>(null);
  const completingTask = useRef(false);

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
    const today = getTodayDate();
    await Promise.all([
      fetchRoutineById(Number(id)),
      fetchTodayLogs(today)
    ]);
  };

  const handleTaskToggle = async (taskId: number) => {
    const today = getTodayDate();
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

  useEffect(() => {
    if (!activeTask) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeTask]);

  useEffect(() => {
    if (!activeTask || !currentRoutine) return;

    const task = currentRoutine.tasks[activeTask.taskIndex];
    if (!task) return;

    let isCurrent = true;
    notificationService.scheduleRoutineTaskCompletion(
      currentRoutine.id,
      currentRoutine.name,
      task.id,
      task.task_name,
      activeTask.endsAt
    ).then(scheduledId => {
      if (isCurrent) {
        notificationId.current = scheduledId;
      } else if (scheduledId) {
        void notificationService.cancelNotification(scheduledId);
      }
    }).catch(error => {
      console.error('Error scheduling routine task notification:', error);
      if (isCurrent) {
        Alert.alert('Notification Error', 'Could not schedule the task completion notification.');
      }
    });

    return () => {
      isCurrent = false;
      const scheduledId = notificationId.current;
      notificationId.current = null;
      if (scheduledId) {
        void notificationService.cancelNotification(scheduledId);
      }
    };
  }, [activeTask, currentRoutine]);

  useEffect(() => {
    if (!activeTask || !currentRoutine || now < activeTask.endsAt || completingTask.current) return;

    const task = currentRoutine.tasks[activeTask.taskIndex];
    if (!task) {
      setActiveTask(null);
      return;
    }

    completingTask.current = true;
    const completeTaskAndContinue = async () => {
      try {
        await logTask({
          routine_task_id: task.id,
          log_date: getTodayDate(),
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        const nextIndex = currentRoutine.tasks.findIndex((nextTask, index) =>
          index > activeTask.taskIndex && todayLogs[nextTask.id]?.status !== 'completed'
        );

        if (nextIndex === -1) {
          setActiveTask(null);
        } else {
          const nextTask = currentRoutine.tasks[nextIndex];
          const nextDuration = Math.max(1, nextTask.duration_minutes || 1);
          setActiveTask({
            taskIndex: nextIndex,
            endsAt: activeTask.endsAt + nextDuration * 60 * 1000,
          });
        }
      } catch (error) {
        console.error('Error completing timed routine task:', error);
        setActiveTask(null);
        Alert.alert('Error', 'Could not save the completed task. Please try again.');
      } finally {
        completingTask.current = false;
      }
    };

    void completeTaskAndContinue();
  }, [activeTask, currentRoutine, logTask, now, todayLogs]);

  const handleStartRoutine = () => {
    if (!currentRoutine || currentRoutine.tasks.length === 0) {
      Alert.alert('No Tasks', 'Add tasks to this routine before starting it.');
      return;
    }

    const taskIndex = currentRoutine.tasks.findIndex(
      task => todayLogs[task.id]?.status !== 'completed'
    );
    if (taskIndex === -1) {
      Alert.alert('Routine Complete', 'All tasks in this routine are already completed today.');
      return;
    }

    const task = currentRoutine.tasks[taskIndex];
    const duration = Math.max(1, task.duration_minutes || 1);
    setNow(Date.now());
    setActiveTask({
      taskIndex,
      endsAt: Date.now() + duration * 60 * 1000,
    });
  };

  const handleStopRoutine = () => {
    setActiveTask(null);
  };

  if (!currentRoutine) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isRoutineComplete = currentRoutine.tasks.length > 0 &&
    currentRoutine.tasks.every(task => todayLogs[task.id]?.status === 'completed');

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

      <View style={[styles.runnerSection, { backgroundColor: theme.colors.card }]}>
        {activeTask ? (() => {
          const task = currentRoutine.tasks[activeTask.taskIndex];
          const durationMs = Math.max(1, task.duration_minutes || 1) * 60 * 1000;
          const remainingMs = Math.max(0, activeTask.endsAt - now);
          const remainingProgress = Math.min(100, (remainingMs / durationMs) * 100);
          const minutes = Math.floor(remainingMs / 60000);
          const seconds = Math.floor((remainingMs % 60000) / 1000);

          return (
            <>
              <Text style={[styles.runnerTitle, { color: theme.colors.text }]}>
                Task {activeTask.taskIndex + 1} of {currentRoutine.tasks.length}
              </Text>
              <Text style={[styles.activeTaskName, { color: theme.colors.text }]}>
                {task.task_name}
              </Text>
              <ProgressRing
                progress={remainingProgress}
                size={164}
                strokeWidth={12}
                color={currentRoutine.color || theme.colors.primary}
              >
                <Text style={[styles.countdown, { color: theme.colors.text }]}>
                  {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                </Text>
                <Text style={[styles.countdownLabel, { color: theme.colors.textSecondary }]}>
                  remaining
                </Text>
              </ProgressRing>
              <Pressable
                onPress={handleStopRoutine}
                style={[styles.runnerButton, { backgroundColor: theme.colors.danger }]}
              >
                <Ionicons name="stop" size={18} color="#fff" />
                <Text style={styles.runnerButtonText}>Stop Routine</Text>
              </Pressable>
            </>
          );
        })() : (
          <>
            <Text style={[styles.runnerTitle, { color: theme.colors.text }]}>
              {isRoutineComplete ? 'Routine complete for today' : 'Ready when you are'}
            </Text>
            <Pressable
              onPress={handleStartRoutine}
              disabled={currentRoutine.tasks.length === 0 || isRoutineComplete}
              style={[
                styles.runnerButton,
                { backgroundColor: theme.colors.primary },
                (currentRoutine.tasks.length === 0 || isRoutineComplete) && styles.disabledButton,
              ]}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.runnerButtonText}>
                {isRoutineComplete ? 'Completed Today' : 'Start Routine'}
              </Text>
            </Pressable>
          </>
        )}
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
              disabled={Boolean(activeTask)}
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
  runnerSection: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  runnerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTaskName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  countdown: {
    fontSize: 30,
    fontWeight: '700',
  },
  countdownLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  runnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  runnerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
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