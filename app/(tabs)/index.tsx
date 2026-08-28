import React, { useEffect, useState, useRef } from 'react';
import { getDatabase } from '../../src/database/database';
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useHabitStore } from '../../src/stores/habitStore';
import { useRoutineStore } from '../../src/stores/routineStore';
import { statisticsService } from '../../src/services/statisticsService';
import { ProgressRing } from '../../src/components/Dashboard/ProgressRing';
import { StreakCard } from '../../src/components/Dashboard/StreakCard';
import { QuoteCard } from '../../src/components/Dashboard/QuoteCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const { habits, todayLogs, fetchHabits, fetchTodayLogs, logHabit } = useHabitStore();
  const { routines, fetchRoutines } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);
  const [todayProgress, setTodayProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const quoteSpinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    animateIn();
    startPulseAnimation();
    checkQuotes();
  }, []);

  const checkQuotes = async () => {
    try {
      const db = getDatabase();
      const quotes = await db.getAllAsync('SELECT * FROM quotes');
      console.log('📚 All quotes in database:', quotes.length);
      if (quotes.length > 0) {
        console.log('📚 First quote:', quotes[0]);
      }
    } catch (error) {
      console.error('❌ Error checking quotes:', error);
    }
  };

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
      console.log('📖 Loading quote...');
      const quoteData = await statisticsService.getQuoteOfDay();
      console.log('📖 Quote loaded:', quoteData);
      
      if (quoteData && quoteData.text) {
        setQuote({
          text: quoteData.text,
          author: quoteData.author || 'Unknown',
        });
      } else {
        setQuote({ 
          text: 'Discipline is the bridge between goals and accomplishment.', 
          author: 'Jim Rohn' 
        });
      }
    } catch (error) {
      console.error('❌ Error loading quote:', error);
      setQuote({ 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      });
    }
  };

  const refreshQuote = async () => {
    console.log('🔄 Refreshing quote...');
    setIsRefreshingQuote(true);
    
    // Animate the refresh icon
    Animated.timing(quoteSpinAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      quoteSpinAnim.setValue(0);
    });

    // Get a random quote instead of quote of day
    try {
      const quoteData = await statisticsService.getRandomQuote();
      console.log('🔄 New quote:', quoteData);
      
      if (quoteData && quoteData.text) {
        setQuote({
          text: quoteData.text,
          author: quoteData.author || 'Unknown',
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing quote:', error);
    } finally {
      setIsRefreshingQuote(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const today = getLocalDate();
      
      // Load data separately to handle errors better
      await Promise.all([
        fetchHabits(),
        fetchTodayLogs(today),
        fetchRoutines(),
      ]);

      // Get stats with fallback
      let stats = { habits: { total: 0, completed: 0 }, routines: { total: 0, completed: 0 } };
      try {
        stats = await statisticsService.getTodayStats(today);
      } catch (error) {
        console.error('Error getting stats:', error);
      }

      // Get streak with fallback
      let streak = 0;
      try {
        streak = await statisticsService.getCurrentStreak();
      } catch (error) {
        console.error('Error getting streak:', error);
      }

      // Get routines with fallback
      let routinesToday = [];
      try {
        routinesToday = await statisticsService.getTodayRoutines(today);
      } catch (error) {
        console.error('Error getting routines:', error);
      }

      // Safely calculate progress
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
    
    // Load quote separately
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
    {
      icon: 'add-circle-outline',
      title: 'New Habit',
      subtitle: 'Build consistency',
      route: '/habit/create',
      color: theme.colors.primary,
    },
    {
      icon: 'list-outline',
      title: 'New Routine',
      subtitle: 'Create flow',
      route: '/routine/create',
      color: theme.colors.success,
    },
    {
      icon: 'alert-circle-outline',
      title: 'Log Excuse',
      subtitle: 'Track patterns',
      route: '/excuses',
      color: theme.colors.danger,
    },
    {
      icon: 'stats-chart-outline',
      title: 'Statistics',
      subtitle: 'View insights',
      route: '/statistics',
      color: theme.colors.warning,
    },
  ];

  const completedHabits = habits.filter(h => todayLogs[h.id]?.status === 'completed').length;
  const remainingHabits = Math.max(habits.length - completedHabits, 0);

  const spin = quoteSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ProgressRing progress={0} size={120} strokeWidth={10}>
            <Ionicons name="flame" size={32} color={theme.colors.warning} />
          </ProgressRing>
        </Animated.View>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
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
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: theme.colors.text }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
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
                styles.avatarButton, 
                { 
                  backgroundColor: theme.colors.primary,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                }
              ]}
            >
              <Ionicons name="person" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Progress Card */}
          <View style={[styles.progressCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.progressSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <ProgressRing progress={todayProgress} size={170} strokeWidth={15}>
                  <Text style={[styles.progressPercent, { color: theme.colors.text }]}>
                    {todayProgress.toFixed(0)}%
                  </Text>
                  <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                    Today's Progress
                  </Text>
                </ProgressRing>
              </Animated.View>
              
              <View style={styles.progressStats}>
                <View style={[styles.statBadge, { backgroundColor: theme.colors.success + '15' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={[styles.statText, { color: theme.colors.text }]}>
                    {completedHabits} Done
                  </Text>
                </View>
                <View style={[styles.statBadge, { backgroundColor: theme.colors.warning + '15' }]}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                  <Text style={[styles.statText, { color: theme.colors.text }]}>
                    {remainingHabits} Left
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Streak Card */}
          <View style={styles.streakSection}>
            <StreakCard currentStreak={currentStreak} bestStreak={currentStreak} />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <Animated.View
                  key={action.title}
                  style={[
                    styles.quickActionWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 30 + (index % 2) * 10],
                          }) 
                        },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => router.push(action.route)}
                    style={({ pressed }) => [
                      styles.quickAction,
                      { 
                        backgroundColor: theme.colors.card,
                        borderColor: action.color + '30',
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                    ]}
                  >
                    <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                      <Ionicons name={action.icon as any} size={26} color={action.color} />
                    </View>
                    <View style={styles.quickActionText}>
                      <Text style={[styles.quickTitle, { color: theme.colors.text }]}>
                        {action.title}
                      </Text>
                      <Text style={[styles.quickSubtitle, { color: theme.colors.textSecondary }]}>
                        {action.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Today's Routines */}
          {todayRoutines.length > 0 && (
            <View style={styles.routinesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Today's Routines
                </Text>
                <Pressable onPress={() => router.push('/routines')}>
                  <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
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
                          backgroundColor: routine.color || theme.colors.primary,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                      ]}
                    >
                      <View style={styles.routineHeader}>
                        <Ionicons name={routine.icon as any} size={22} color="#fff" />
                        <View style={styles.routineInfo}>
                          <Text style={styles.routineName}>{routine.name}</Text>
                          <Text style={styles.routineStats}>
                            {routine.completed_tasks} of {routine.total_tasks} tasks
                          </Text>
                        </View>
                        <Text style={styles.routineProgress}>{progress.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.routineProgressBar}>
                        <Animated.View 
                          style={[
                            styles.routineProgressFill, 
                            { 
                              width: `${progress}%`,
                              backgroundColor: '#fff',
                            },
                          ]} 
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Today's Habits */}
          <View style={styles.habitsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Today's Habits
              </Text>
              <Pressable onPress={() => router.push('/habits')}>
                <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
                  See All
                </Text>
              </Pressable>
            </View>
            
            {habits.length === 0 ? (
              <Pressable
                onPress={() => router.push('/habit/create')}
                style={[styles.emptyCard, { backgroundColor: theme.colors.card }]}
              >
                <Ionicons name="add-circle-outline" size={40} color={theme.colors.primary} />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
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
                          backgroundColor: theme.colors.card,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          borderColor: isCompleted ? theme.colors.success : theme.colors.border + '50',
                        },
                      ]}
                    >
                      <View style={[styles.habitIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                        <Ionicons name={habit.icon as any} size={20} color={theme.colors.primary} />
                      </View>
                      <View style={styles.habitContent}>
                        <Text style={[
                          styles.habitName, 
                          { 
                            color: theme.colors.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.6 : 1,
                          },
                        ]}>
                          {habit.name}
                        </Text>
                        <Text style={[styles.habitMeta, { color: theme.colors.textSecondary }]}>
                          {habit.frequency_type} • {habit.target_count}x
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleQuickComplete(habit.id)}
                        hitSlop={8}
                        style={[
                          styles.completeButton,
                          {
                            backgroundColor: isCompleted ? theme.colors.success : 'transparent',
                            borderColor: isCompleted ? theme.colors.success : theme.colors.border,
                          },
                        ]}
                      >
                        <Ionicons 
                          name={isCompleted ? 'checkmark' : 'ellipse-outline'} 
                          size={20} 
                          color={isCompleted ? '#fff' : theme.colors.textSecondary} 
                        />
                      </Pressable>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>

          {/* Quote Section */}
          <View style={styles.quoteSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.quoteHeaderLeft}>
                <Ionicons name="sparkles" size={20} color={theme.colors.warning} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0, marginLeft: 8 }]}>
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
                    backgroundColor: theme.colors.primary + '10',
                    opacity: pressed || isRefreshingQuote ? 0.5 : 1,
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </Animated.View>
              </Pressable>
            </View>
            <QuoteCard quote={quote.text} author={quote.author} />
          </View>

          {/* Bottom Spacing */}
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
  },
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
  },
  progressCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 20,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  progressPercent: {
    fontSize: 38,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  streakSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionWrapper: {
    width: '47%',
    marginBottom: 4,
  },
  quickAction: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minHeight: 130,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    alignItems: 'center',
    width: '100%',
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    flexShrink: 1,
  },
  routinesSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  routineCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  routineStats: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  routineProgress: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routineProgressBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  routineProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  habitsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  habitIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  habitMeta: {
    fontSize: 12,
  },
  completeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  quoteSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  quoteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshQuoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});