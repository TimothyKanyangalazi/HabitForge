import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  RefreshControl, 
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { useHabitStore } from '../../src/stores/habitStore';
import { useRoutineStore } from '../../src/stores/routineStore';
import { statisticsService } from '../../src/services/statisticsService';
import { ProgressRing } from '../../src/components/Dashboard/ProgressRing';
import { StreakCard } from '../../src/components/Dashboard/StreakCard';
import { QuoteCard } from '../../src/components/Dashboard/QuoteCard';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { habits, todayLogs, fetchHabits, fetchTodayLogs, logHabit } = useHabitStore();
  const { routines, fetchRoutines } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todayProgress, setTodayProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const quoteSpinAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadData();
    animateIn();
    startPulseAnimation();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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

    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.stagger(100,
      quickActionsAnim.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const getLocalDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadQuote = async () => {
    try {
      const quoteData = await statisticsService.getQuoteOfDay();
      if (quoteData && quoteData.text) {
        setQuote({ text: quoteData.text, author: quoteData.author || 'Unknown' });
      } else {
        setQuote({ 
          text: 'Discipline is the bridge between goals and accomplishment.', 
          author: 'Jim Rohn' 
        });
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      setQuote({ 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      });
    }
  };

  const refreshQuote = async () => {
    setIsRefreshingQuote(true);
    
    Animated.timing(quoteSpinAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      quoteSpinAnim.setValue(0);
    });

    try {
      const quoteData = await statisticsService.getRandomQuote();
      if (quoteData && quoteData.text) {
        setQuote({ text: quoteData.text, author: quoteData.author || 'Unknown' });
      }
    } catch (error) {
      console.error('Error refreshing quote:', error);
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const today = getLocalDate();
      
      await Promise.all([
        fetchHabits(),
        fetchTodayLogs(today),
        fetchRoutines(),
      ]);

      let stats = { habits: { total: 0, completed: 0 }, routines: { total: 0, completed: 0 } };
      try {
        stats = await statisticsService.getTodayStats(today);
      } catch (error) {
        console.error('Error getting stats:', error);
      }

      let streak = 0;
      try {
        streak = await statisticsService.getCurrentStreak();
      } catch (error) {
        console.error('Error getting streak:', error);
      }

      let routinesToday = [];
      try {
        routinesToday = await statisticsService.getTodayRoutines(today);
      } catch (error) {
        console.error('Error getting routines:', error);
      }

      const totalHabits = stats?.habits?.total ?? 0;
      const completedHabitsCount = stats?.habits?.completed ?? 0;
      const progress = totalHabits > 0 ? (completedHabitsCount / totalHabits) * 100 : 0;
      
      setTodayProgress(progress);
      setCurrentStreak(streak ?? 0);
      setTodayRoutines(routinesToday ?? []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
    
    await loadQuote();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickComplete = async (habitId: number) => {
    const today = getLocalDate();
    const currentLog = todayLogs[habitId];
    
    let newStatus: 'completed' | 'missed' | 'skipped' = 'completed';
    if (currentLog?.status === 'completed') {
      newStatus = 'missed';
    }

    try {
      await logHabit({
        habit_id: habitId,
        log_date: today,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });
      await loadData();
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  const quickActions = [
    { icon: 'add-circle-outline', title: 'New Habit', route: '/habit/create', gradient: ['#667eea', '#764ba2'] },
    { icon: 'list-outline', title: 'New Routine', route: '/routine/create', gradient: ['#28B67A', '#1a8a5c'] },
    { icon: 'alert-circle-outline', title: 'Log Excuse', route: '/excuses', gradient: ['#F05D5E', '#c0392b'] },
    { icon: 'stats-chart-outline', title: 'Statistics', route: '/statistics', gradient: ['#F4A340', '#d68910'] },
  ];

  const completedHabits = habits.filter(h => todayLogs[h.id]?.status === 'completed').length;
  const remainingHabits = Math.max(habits.length - completedHabits, 0);

  const spin = quoteSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ProgressRing progress={0} size={120} strokeWidth={10}>
            <Ionicons name="flame" size={32} color={colors.warning} />
          </ProgressRing>
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [
                  { 
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }) 
                  },
                ],
              },
            ]}
          >
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <Pressable 
  onPress={() => router.push('/profile')}
  style={({ pressed }) => [
    { transform: [{ scale: pressed ? 0.9 : 1 }] },
  ]}
>
  <LinearGradient
    colors={[colors.primary, colors.secondary]}
    style={styles.avatarButton}
  >
    <Image 
      source={require('../../assets/HF3.png')} 
      style={styles.avatarImage}
      resizeMode="cover"
    />
  </LinearGradient>
</Pressable>
          </Animated.View>

          {/* Progress Card */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={[colors.primary + '15', colors.secondary + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.progressCard}
            >
              <View style={styles.progressSection}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <ProgressRing progress={todayProgress} size={160} strokeWidth={14}>
                    <Text style={[styles.progressPercent, { color: colors.text }]}>
                      {todayProgress.toFixed(0)}%
                    </Text>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                      Complete
                    </Text>
                  </ProgressRing>
                </Animated.View>
                
                <View style={styles.progressStatsRow}>
                  <View style={[styles.progressStatItem, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <View>
                      <Text style={[styles.progressStatValue, { color: colors.success }]}>
                        {completedHabits}
                      </Text>
                      <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                        Done
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.progressStatItem, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="time-outline" size={20} color={colors.warning} />
                    <View>
                      <Text style={[styles.progressStatValue, { color: colors.warning }]}>
                        {remainingHabits}
                      </Text>
                      <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                        Remaining
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Streak Card */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <StreakCard currentStreak={currentStreak} bestStreak={currentStreak} />
          </Animated.View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <Animated.View
                  key={action.title}
                  style={[
                    styles.quickActionWrapper,
                    {
                      opacity: quickActionsAnim[index],
                      transform: [
                        { 
                          translateY: quickActionsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0],
                          }) 
                        },
                        {
                          scale: quickActionsAnim[index],
                        },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => router.push(action.route)}
                    style={({ pressed }) => [
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.quickAction}
                    >
                      <View style={styles.quickIcon}>
                        <Ionicons name={action.icon as any} size={26} color="#fff" />
                      </View>
                      <Text style={styles.quickTitle}>
                        {action.title}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Today's Routines */}
          {todayRoutines.length > 0 && (
            <Animated.View style={[styles.routinesSection, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Today's Routines
                </Text>
                <Pressable onPress={() => router.push('/routines')}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>
                    View All
                  </Text>
                </Pressable>
              </View>
              {todayRoutines.map((routine, index) => {
                const progress = routine.total_tasks > 0 
                  ? (routine.completed_tasks / routine.total_tasks) * 100 
                  : 0;
                
                return (
                  <Animated.View
                    key={routine.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 30 + index * 15],
                          }) 
                        },
                      ],
                    }}
                  >
                    <Pressable
                      onPress={() => router.push(`/routine/${routine.id}`)}
                      style={({ pressed }) => [
                        styles.routineCard,
                        { 
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          elevation: 2,
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                        },
                      ]}
                    >
                      <View style={styles.routineHeader}>
                        <View style={[styles.routineIcon, { backgroundColor: routine.color + '20' }]}>
                          <Ionicons name={routine.icon as any} size={20} color={routine.color} />
                        </View>
                        <View style={styles.routineInfo}>
                          <Text style={[styles.routineName, { color: colors.text }]}>
                            {routine.name}
                          </Text>
                          <Text style={[styles.routineStats, { color: colors.textSecondary, paddingBottom: 4 }]}>
                            {routine.completed_tasks} of {routine.total_tasks} tasks
                          </Text>
                        </View>
                        <View style={[styles.routinePercentBadge, { backgroundColor: routine.color + '15' }]}>
                          <Text style={[styles.routinePercentText, { color: routine.color }]}>
                            {progress.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.routineProgressBar, { backgroundColor: colors.border }]}>
                        <Animated.View 
                          style={[
                            styles.routineProgressFill, 
                            { 
                              width: `${progress}%`,
                              backgroundColor: routine.color || colors.primary,
                            },
                          ]} 
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Today's Habits */}
          <Animated.View style={[styles.habitsSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Habits
              </Text>
              <Pressable onPress={() => router.push('/habits')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See All
                </Text>
              </Pressable>
            </View>
            
            {habits.length === 0 ? (
              <Pressable
                onPress={() => router.push('/habit/create')}
                style={[styles.emptyCard, { backgroundColor: colors.card }]}
              >
                <Ionicons name="add-circle-outline" size={40} color={colors.primary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Create your first habit
                </Text>
              </Pressable>
            ) : (
              habits.slice(0, 5).map((habit, index) => {
                const log = todayLogs[habit.id];
                const isCompleted = log?.status === 'completed';
                
                return (
                  <Animated.View
                    key={habit.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 20 + index * 8],
                          }) 
                        },
                      ],
                    }}
                  >
                    <Pressable
                      onPress={() => router.push(`/habit/${habit.id}`)}
                      style={({ pressed }) => [
                        styles.habitItem,
                        { 
                          backgroundColor: colors.card,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          borderColor: isCompleted ? colors.success : colors.border + '50',
                          elevation: 2,
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                        },
                      ]}
                    >
                      <View style={[styles.habitIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={habit.icon as any} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.habitContent}>
                        <Text style={[
                          styles.habitName, 
                          { 
                            color: colors.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.6 : 1,
                          },
                        ]}>
                          {habit.name}
                        </Text>
                        <Text style={[styles.habitMeta, { color: colors.textSecondary }]}>
                          {habit.frequency_type} • {habit.target_count}x
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleQuickComplete(habit.id)}
                        hitSlop={8}
                        style={[
                          styles.completeButton,
                          {
                            backgroundColor: isCompleted ? colors.success : 'transparent',
                            borderColor: isCompleted ? colors.success : colors.border,
                            marginRight: 4,
                          },
                        ]}
                      >
                        <Ionicons 
                          name={isCompleted ? 'checkmark' : 'ellipse-outline'} 
                          size={20} 
                          color={isCompleted ? '#fff' : colors.textSecondary} 
                        />
                      </Pressable>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>

          {/* Quote Section */}
          <Animated.View style={[styles.quoteSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.quoteHeaderLeft}>
                <Ionicons name="sparkles" size={18} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                  Daily Inspiration
                </Text>
              </View>
              <Pressable 
                onPress={refreshQuote}
                disabled={isRefreshingQuote}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.refreshQuoteButton,
                  { 
                    backgroundColor: colors.primary + '10',
                    opacity: pressed || isRefreshingQuote ? 0.5 : 1,
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                </Animated.View>
              </Pressable>
            </View>
            <QuoteCard quote={quote.text} author={quote.author} />
          </Animated.View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  date: { fontSize: 15 },
  avatarButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  overflow: 'hidden',
},
avatarImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
},

  progressCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  progressSection: { alignItems: 'center', paddingVertical: 8 },
  progressPercent: { fontSize: 36, fontWeight: '800' },
  progressLabel: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  progressStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  progressStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  progressStatValue: { fontSize: 18, fontWeight: '700' },
  progressStatLabel: { fontSize: 11, marginTop: 1 },
  streakSection: { marginTop: 20, paddingHorizontal: 20 },
  quickActionsSection: { paddingHorizontal: 16, marginTop: 28 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 16, paddingHorizontal: 4 },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionWrapper: { width: '47%', marginBottom: 4 },
  quickAction: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
  routinesSection: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontWeight: '600' },
  routineCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  routineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: '600' },
  routineStats: { fontSize: 11, marginTop: 2 },
  routinePercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routinePercentText: { fontSize: 13, fontWeight: '700' },
  routineProgressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  routineProgressFill: { height: '100%', borderRadius: 2 },
  habitsSection: { paddingHorizontal: 20, marginTop: 28 },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  habitContent: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  habitMeta: { fontSize: 12 },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emptyCard: { padding: 24, borderRadius: 16, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  quoteSection: { paddingHorizontal: 20, marginTop: 28 },
  quoteHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  refreshQuoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});