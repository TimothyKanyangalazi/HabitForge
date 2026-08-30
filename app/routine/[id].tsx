import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const taskAnimations = useRef(currentRoutine?.tasks.map(() => new Animated.Value(0)) || []).current;

  useEffect(() => {
    loadRoutine();
    animateIn();
  }, [id]);

  useEffect(() => {
    if (currentRoutine && todayLogs) {
      const totalTasks = currentRoutine.tasks.length;
      const completedTasks = currentRoutine.tasks.filter(
        task => todayLogs[task.id]?.status === 'completed'
      ).length;
      const newProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      setProgress(newProgress);
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: newProgress,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [currentRoutine, todayLogs]);

  useEffect(() => {
    if (currentRoutine?.tasks) {
      Animated.stagger(100,
        currentRoutine.tasks.map((_, index) => 
          Animated.spring(taskAnimations[index] || new Animated.Value(0), {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [currentRoutine?.tasks.length]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start();
  };

  const loadRoutine = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await Promise.all([
        fetchRoutineById(Number(id)),
        fetchTodayLogs(today)
      ]);
    } catch (error) {
      console.error('Error loading routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const currentLog = todayLogs[taskId];
    
    // Toggle: completed -> skipped (incomplete), not completed -> completed
    const newStatus: 'completed' | 'missed' | 'skipped' = 
      currentLog?.status === 'completed' ? 'skipped' : 'completed';

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (currentRoutine) {
              deleteRoutine(currentRoutine.id);
              router.back();
            }
          }
        }
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Routine',
      `Archive "${currentRoutine?.name}"? You can restore it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          onPress: () => {
            if (currentRoutine) {
              archiveRoutine(currentRoutine.id);
              router.back();
            }
          }
        }
      ]
    );
  };

  if (isLoading || !currentRoutine) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
          <Ionicons name="list" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading routine...
        </Text>
      </View>
    );
  }

  const completedTasks = currentRoutine.tasks.filter(
    task => todayLogs[task.id]?.status === 'completed'
  ).length;
  const totalDuration = currentRoutine.tasks.reduce((sum, task) => sum + (task.duration_minutes || 0), 0);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header with Gradient */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              { 
                scale: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }) 
              },
            ],
          }}
        >
          <LinearGradient
            colors={[currentRoutine.color || colors.primary, currentRoutine.color + 'CC' || colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.routineIconContainer}>
                <Ionicons name={currentRoutine.icon as any} size={40} color="#fff" />
              </View>
              <Text style={styles.routineName}>{currentRoutine.name}</Text>
              {currentRoutine.description && (
                <Text style={styles.routineDescription}>{currentRoutine.description}</Text>
              )}
              
              {/* Info Badges */}
              <View style={styles.infoBadges}>
                {currentRoutine.start_time && (
                  <View style={styles.infoBadge}>
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.infoBadgeText}>{currentRoutine.start_time}</Text>
                  </View>
                )}
                <View style={styles.infoBadge}>
                  <Ionicons name="list-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.infoBadgeText}>{currentRoutine.tasks.length} tasks</Text>
                </View>
                <View style={styles.infoBadge}>
                  <Ionicons name="hourglass-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.infoBadgeText}>{totalDuration} min</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Progress Section */}
        <View style={[styles.progressSection, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Today's Progress
              </Text>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {completedTasks} of {currentRoutine.tasks.length} tasks completed
              </Text>
            </View>
            <View style={[styles.progressPercentBadge, { backgroundColor: currentRoutine.color + '20' }]}>
              <Text style={[styles.progressPercent, { color: currentRoutine.color }]}>
                {progress.toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: currentRoutine.color || colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]} 
            />
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={[styles.tasksTitle, { color: colors.text }]}>
            Tasks
          </Text>
          {currentRoutine.tasks.map((task, index) => {
            const log = todayLogs[task.id];
            const isCompleted = log?.status === 'completed';
            const taskAnim = taskAnimations[index] || new Animated.Value(1);
            
            return (
              <Animated.View
                key={task.id}
                style={{
                  opacity: taskAnim,
                  transform: [
                    {
                      translateX: taskAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={() => handleTaskToggle(task.id)}
                  style={({ pressed }) => [
                    styles.taskItem,
                    { 
                      backgroundColor: isCompleted ? currentRoutine.color + '10' : colors.card,
                      borderColor: isCompleted ? currentRoutine.color + '40' : colors.border,
                      borderWidth: 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={[
                    styles.taskCheckbox,
                    { 
                      backgroundColor: isCompleted ? currentRoutine.color : 'transparent',
                      borderColor: isCompleted ? currentRoutine.color : colors.border,
                    }
                  ]}>
                    {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  
                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskName, 
                      { 
                        color: colors.text,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1,
                      },
                    ]}>
                      {task.task_name}
                    </Text>
                    <Text style={[styles.taskDuration, { color: colors.textSecondary }]}>
                      {task.duration_minutes} minutes
                    </Text>
                  </View>
                  
                  {isCompleted && (
                    <Ionicons name="checkmark-circle" size={20} color={currentRoutine.color} />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => router.push(`/routine/edit?id=${currentRoutine.id}`)}
            style={({ pressed }) => [
              { flex: 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.actionButton}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.actionText}>Edit</Text>
            </LinearGradient>
          </Pressable>
          
          <Pressable
            onPress={handleArchive}
            style={({ pressed }) => [
              styles.actionButton,
              { 
                backgroundColor: colors.warning + '20',
                borderColor: colors.warning,
                borderWidth: 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Ionicons name="archive" size={18} color={colors.warning} />
            <Text style={[styles.actionText, { color: colors.warning }]}>Archive</Text>
          </Pressable>
          
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.actionButton,
              { 
                backgroundColor: colors.danger + '20',
                borderColor: colors.danger,
                borderWidth: 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { alignItems: 'center' },
  routineIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  routineName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  routineDescription: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 12 },
  infoBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  infoBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  progressSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: { fontSize: 16, fontWeight: '700' },
  progressSubtitle: { fontSize: 12, marginTop: 2 },
  progressPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPercent: { fontSize: 16, fontWeight: '800' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  tasksSection: { padding: 16, paddingTop: 0 },
  tasksTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  taskCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  taskDuration: { fontSize: 12 },
  actionsContainer: { flexDirection: 'row', padding: 16, paddingTop: 0, gap: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});