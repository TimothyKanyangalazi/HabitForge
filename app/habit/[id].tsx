import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabitStore } from '../../src/stores/habitStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { habitService } from '../../src/services/habitService';
import { Habit, HabitLog } from '../../src/types';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { habits, deleteHabit, archiveHabit } = useHabitStore();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHabit();
    animateIn();
  }, [id]);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations
    Animated.spring(iconAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.spring(statsAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 400,
      useNativeDriver: true,
    }).start();

    Animated.spring(actionsAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadHabit = async () => {
    setIsLoading(true);
    try {
      const habitId = Number(id);
      const foundHabit = habits.find(h => h.id === habitId);
      if (foundHabit) {
        setHabit(foundHabit);
      } else {
        const fetched = await habitService.fetchById(habitId);
        setHabit(fetched);
      }

      const habitLogs = await habitService.getLogsByHabit(habitId);
      setLogs(habitLogs || []);
    } catch (error) {
      console.error('Error loading habit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (habit) {
              await deleteHabit(habit.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Habit',
      `Archive "${habit?.name}"? You can restore it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            if (habit) {
              await archiveHabit(habit.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (isLoading || !habit) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons name="ellipsis-horizontal" size={40} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading habit...
        </Text>
      </View>
    );
  }

  const completedLogs = logs.filter(l => l.status === 'completed').length;
  const missedLogs = logs.filter(l => l.status === 'missed').length;
  const completionRate = logs.length > 0
    ? (completedLogs / logs.length) * 100
    : 0;
  const currentStreak = calculateCurrentStreak(logs);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        {/* Header with Gradient */}
        <Animated.View
          style={{
            opacity: iconAnim,
            transform: [
              {
                scale: iconAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={habit.icon as any} size={40} color="#fff" />
            </View>
            <Text style={styles.name}>{habit.name}</Text>
            {habit.description && (
              <Text style={styles.description}>
                {habit.description}
              </Text>
            )}
            
            {/* Habit Info Badges */}
            <View style={styles.infoBadges}>
              <View style={styles.infoBadge}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.infoBadgeText}>
                  {habit.frequency_type}
                </Text>
              </View>
              <View style={styles.infoBadge}>
                <Ionicons name="repeat-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.infoBadgeText}>
                  {habit.target_count}x daily
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: statsAnim,
              transform: [
                {
                  translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.statCard}
            >
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {logs.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Days
              </Text>
            </LinearGradient>
            
            <LinearGradient
              colors={[colors.success + '20', colors.success + '10']}
              style={styles.statCard}
            >
              <Ionicons name="trending-up" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {completionRate.toFixed(0)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Success Rate
              </Text>
            </LinearGradient>
            
            <LinearGradient
              colors={[colors.warning + '20', colors.warning + '10']}
              style={styles.statCard}
            >
              <Ionicons name="flame" size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Day Streak
              </Text>
            </LinearGradient>
          </View>

          {/* Completion Stats */}
          <View style={[styles.completionStats, { backgroundColor: colors.card }]}>
            <View style={styles.completionItem}>
              <View style={[styles.completionDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.completionLabel, { color: colors.text }]}>
                Completed
              </Text>
              <Text style={[styles.completionValue, { color: colors.success }]}>
                {completedLogs}
              </Text>
            </View>
            <View style={styles.completionDivider} />
            <View style={styles.completionItem}>
              <View style={[styles.completionDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.completionLabel, { color: colors.text }]}>
                Missed
              </Text>
              <Text style={[styles.completionValue, { color: colors.danger }]}>
                {missedLogs}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent History */}
        {logs.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent History
            </Text>
            {logs.slice(0, 7).map((log, index) => (
              <View key={log.id} style={[styles.historyItem, { backgroundColor: colors.card }]}>
                <View style={[
                  styles.historyStatus,
                  { 
                    backgroundColor: log.status === 'completed' 
                      ? colors.success + '20' 
                      : log.status === 'missed' 
                      ? colors.danger + '20' 
                      : colors.border,
                  },
                ]}>
                  <Ionicons 
                    name={log.status === 'completed' ? 'checkmark' : log.status === 'missed' ? 'close' : 'remove'} 
                    size={16} 
                    color={log.status === 'completed' ? colors.success : log.status === 'missed' ? colors.danger : colors.textSecondary} 
                  />
                </View>
                <Text style={[styles.historyDate, { color: colors.text }]}>
                  {new Date(log.log_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
                <Text style={[
                  styles.historyStatusText,
                  { 
                    color: log.status === 'completed' 
                      ? colors.success 
                      : log.status === 'missed' 
                      ? colors.danger 
                      : colors.textSecondary,
                  },
                ]}>
                  {log.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: actionsAnim,
              transform: [
                {
                  translateY: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={() => router.push(`/habit/edit?id=${habit.id}`)}
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
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

// Helper function to calculate current streak
function calculateCurrentStreak(logs: HabitLog[]): number {
  const completedLogs = logs
    .filter(log => log.status === 'completed')
    .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  if (completedLogs.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const log of completedLogs) {
    const logDate = new Date(log.log_date);
    logDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor(
      (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0 || diffDays === streak) {
      streak++;
      currentDate = logDate;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  headerGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 12 },
  infoBadges: { flexDirection: 'row', gap: 8 },
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
  statsSection: { padding: 16 },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  completionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  completionItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  completionDot: { width: 8, height: 8, borderRadius: 4 },
  completionLabel: { fontSize: 12, flex: 1 },
  completionValue: { fontSize: 16, fontWeight: '700' },
  completionDivider: { width: 1, height: 24, backgroundColor: '#ddd', marginHorizontal: 8 },
  historySection: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 10,
  },
  historyStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: { flex: 1, fontSize: 13, fontWeight: '500' },
  historyStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  actionsContainer: { flexDirection: 'row', padding: 16, gap: 8 },
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