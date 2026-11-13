import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { useHabitStore } from '../../src/stores/habitStore';
import { useRoutineStore } from '../../src/stores/routineStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { statisticsService } from '../../src/services/statisticsService';
import { ProgressRing } from '../../src/components/Dashboard/ProgressRing';
import { StreakCard } from '../../src/components/Dashboard/StreakCard';
import { QuoteCard } from '../../src/components/Dashboard/QuoteCard';
import { Habit } from '../../src/types';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function streakTint(days: number, colors: Record<string, string>): string {
  if (days <= 0) return colors.textMuted ?? '#6B7280';
  if (days < 3) return colors.warning ?? '#F59E0B';
  if (days < 7) return colors.primary;
  return colors.success ?? '#10B981';
}

function formatMoney(amount: number, symbol: string): string {
  if (!amount || amount <= 0) return '';
  const rounded = Math.round(amount);
  return `${symbol} ${rounded.toLocaleString('en-US')}`;
}

interface BreakLogModalState {
  visible: boolean;
  habit: Habit | null;
  mode: 'urge' | 'relapse';
}

const URGES = [2, 4, 6, 8, 10];
const RELAPSE_REASONS = [
  'Bored',
  'Stressed',
  'Social pressure',
  'Tired',
  'Celebrating',
];

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  // ── Theme ──
  const themeCtx = useTheme();
  const theme: any = (themeCtx as any)?.theme ?? themeCtx ?? lightTheme;
  const raw: Record<string, string> = theme?.colors ?? lightTheme.colors;
  const colors = {
    ...raw,
    text: raw.text ?? '#111827',
    textMuted: raw.textMuted ?? raw.textSecondary ?? '#6B7280',
    border: raw.border ?? '#E5E7EB',
    card: raw.card ?? '#FFFFFF',
    primary: raw.primary ?? '#3B82F6',
    secondary: raw.secondary ?? raw.primary ?? '#6366F1',
    background: raw.background ?? '#F9FAFB',
    success: raw.success ?? '#10B981',
    warning: raw.warning ?? '#F59E0B',
    error: raw.error ?? raw.danger ?? '#EF4444',
  };

  // ── Layout breakpoints ──
  const isWide = width >= 380;
  const isVeryNarrow = width < 360;
  const breakLabel = isWide ? 'Best clean' : 'Best';

  // ── Stores ──
  const {
    habits,
    todayLogs,
    stats,
    fetchHabits,
    fetchTodayLogs,
    logHabit,
    logUrge,
    logRelapse,
    refreshStats,
  } = useHabitStore();
  const { routines, fetchRoutines } = useRoutineStore();
  const { settings } = useSettingsStore();

  // ── Settings-driven flags ──
  const breakSettings = (settings as any)?.breakSettings ?? {};
  const showBreakOnDashboard = breakSettings.showBreakOnDashboard ?? true;
  const currencySymbol =
    breakSettings.currencySymbol ?? (settings as any)?.currencySymbol ?? 'MK';

  // ── Local state ──
  const [refreshing, setRefreshing] = useState(false);
  const [todayProgress, setTodayProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Break-log modal
  const [logModal, setLogModal] = useState<BreakLogModalState>({
    visible: false,
    habit: null,
    mode: 'urge',
  });
  const [logIntensity, setLogIntensity] = useState(6);
  const [logReason, setLogReason] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const quoteSpinAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(
    [0, 1, 2, 3].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    loadData();
    animateIn();
    startPulseAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animations ──
  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 800,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 8, tension: 40, useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(headerAnim, {
      toValue: 1, friction: 6, tension: 40, delay: 200, useNativeDriver: true,
    }).start();

    Animated.stagger(
      100,
      quickActionsAnim.map((a) =>
        Animated.spring(a, {
          toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
        })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quote ──
  const loadQuote = useCallback(async () => {
    try {
      const q = await statisticsService.getQuoteOfDay();
      setQuote(
        q?.text
          ? { text: q.text, author: q.author || 'Unknown' }
          : {
              text: 'Discipline is the bridge between goals and accomplishment.',
              author: 'Jim Rohn',
            }
      );
    } catch (e) {
      console.error('Error loading quote:', e);
      setQuote({
        text: 'Discipline is the bridge between goals and accomplishment.',
        author: 'Jim Rohn',
      });
    }
  }, []);

  const refreshQuote = useCallback(async () => {
    setIsRefreshingQuote(true);
    Animated.timing(quoteSpinAnim, {
      toValue: 1, duration: 500,
      easing: Easing.linear, useNativeDriver: true,
    }).start(() => quoteSpinAnim.setValue(0));

    try {
      const q = await statisticsService.getRandomQuote();
      if (q?.text) setQuote({ text: q.text, author: q.author || 'Unknown' });
    } catch (e) {
      console.error('Error refreshing quote:', e);
    } finally {
      setIsRefreshingQuote(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data ──
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = getLocalDate();

      await Promise.all([
        fetchHabits(),
        fetchTodayLogs(today),
        fetchRoutines(),
      ]);

      const state = useHabitStore.getState();
      const freshHabits = state.habits;
      const freshLogs = state.todayLogs;

      const breakOnes = freshHabits.filter((h) => h.habit_type === 'break');
      await Promise.all(breakOnes.map((h) => refreshStats(h.id)));

      let streak = 0;
      try {
        streak = await statisticsService.getCurrentStreak();
      } catch (e) {
        console.error('Error getting streak:', e);
      }

      let routinesToday: any[] = [];
      try {
        routinesToday = await statisticsService.getTodayRoutines(today);
      } catch (e) {
        console.error('Error getting routines:', e);
      }

      const buildHabitsOnly = freshHabits.filter((h) => h.habit_type !== 'break');
      const buildCompleted = buildHabitsOnly.filter(
        (h) => freshLogs[h.id]?.status === 'completed'
      ).length;
      const buildProgress =
        buildHabitsOnly.length > 0
          ? (buildCompleted / buildHabitsOnly.length) * 100
          : 0;

      setTodayProgress(buildProgress);
      setCurrentStreak(streak ?? 0);
      setTodayRoutines(routinesToday ?? []);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setIsLoading(false);
    }

    await loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ── Build habit completion ──
  const handleQuickComplete = useCallback(
    async (habitId: number) => {
      const today = getLocalDate();
      const currentLog = useHabitStore.getState().todayLogs[habitId];
      const newStatus: 'completed' | 'missed' =
        currentLog?.status === 'completed' ? 'missed' : 'completed';

      try {
        await logHabit({
          habit_id: habitId,
          log_date: today,
          status: newStatus,
          completed_at:
            newStatus === 'completed' ? new Date().toISOString() : undefined,
        });
        await loadData();
      } catch (e) {
        console.error('Error logging habit:', e);
      }
    },
    [logHabit, loadData]
  );

  // ── Break habit urges / relapses ──
  const openLogModal = useCallback(
    (habit: Habit, mode: 'urge' | 'relapse') => {
      setLogIntensity(6);
      setLogReason('');
      setLogNotes('');
      setLogModal({ visible: true, habit, mode });
    },
    []
  );

  const closeLogModal = useCallback(() => {
    if (isSavingLog) return;
    setLogModal({ visible: false, habit: null, mode: 'urge' });
  }, [isSavingLog]);

  const submitLog = useCallback(async () => {
    const { habit, mode } = logModal;
    if (!habit) return;
    setIsSavingLog(true);
    try {
      if (mode === 'urge') {
        await logUrge({
          habit_id: habit.id,
          timestamp: new Date().toISOString(),
          intensity: logIntensity,
          notes: logNotes.trim() || undefined,
        } as any);
      } else {
        await logRelapse({
          habit_id: habit.id,
          relapse_date: getLocalDate(),
          reason: logReason.trim() || logNotes.trim() || undefined,
        } as any);
      }
      await refreshStats(habit.id);
      closeLogModal();
    } catch (e) {
      console.error(`Error logging ${mode}:`, e);
      Alert.alert('Error', `Failed to log ${mode}. Please try again.`);
    } finally {
      setIsSavingLog(false);
    }
  }, [
    logModal,
    logIntensity,
    logNotes,
    logReason,
    logUrge,
    logRelapse,
    refreshStats,
    closeLogModal,
  ]);

  // ── Derived data ──
  const buildHabits = useMemo(
    () => habits.filter((h) => h.habit_type !== 'break'),
    [habits]
  );
  const breakHabits = useMemo(
    () => habits.filter((h) => h.habit_type === 'break'),
    [habits]
  );
  const completedHabits = buildHabits.filter(
    (h) => todayLogs[h.id]?.status === 'completed'
  ).length;
  const remainingHabits = Math.max(buildHabits.length - completedHabits, 0);
  const bestBreakStreak = useMemo(
    () =>
      breakHabits.reduce(
        (best, h) => Math.max(best, stats[h.id]?.days_clean ?? 0),
        0
      ),
    [breakHabits, stats]
  );

  const quickActions = [
    { icon: 'add-circle-outline', title: 'New Habit', route: '/habit/create', gradient: ['#667eea', '#764ba2'] },
    { icon: 'list-outline', title: 'New Routine', route: '/routine/create', gradient: ['#28B67A', '#1a8a5c'] },
    { icon: 'alert-circle-outline', title: 'Log Excuse', route: '/excuses', gradient: ['#F05D5E', '#c0392b'] },
    { icon: 'stats-chart-outline', title: 'Statistics', route: '/statistics', gradient: ['#F4A340', '#d68910'] },
  ];

  const spin = quoteSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ProgressRing progress={0} size={120} strokeWidth={10}>
            <Ionicons name="flame" size={32} color={colors.warning} />
          </ProgressRing>
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  // ── Render ──
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
          {/* ── Header ─────────────────────────────────────── */}
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
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.date, { color: colors.textMuted }]}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityLabel="Open profile"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.9 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.avatarButton}
              >
                {avatarError ? (
                  <Ionicons name="person" size={22} color="#fff" />
                ) : (
                  <Image
                    source={require('../../assets/HF3.png')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setAvatarError(true)}
                  />
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Progress card (build habits only) ──────────── */}
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
                    <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                      Build habits
                    </Text>
                  </ProgressRing>
                </Animated.View>

                <View
                  style={[
                    styles.progressStatsRow,
                    isVeryNarrow && { flexWrap: 'wrap' },
                  ]}
                >
                  {/* Done */}
                  <View
                    style={[
                      styles.progressStatItem,
                      { backgroundColor: colors.success + '15' },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.success}
                    />
                    <View style={styles.progressStatTextCol}>
                      <Text
                        style={[
                          styles.progressStatValue,
                          { color: colors.success },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {completedHabits}
                      </Text>
                      <Text
                        style={[
                          styles.progressStatLabel,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        Done
                      </Text>
                    </View>
                  </View>

                  {/* Remaining */}
                  <View
                    style={[
                      styles.progressStatItem,
                      { backgroundColor: colors.warning + '15' },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.warning}
                    />
                    <View style={styles.progressStatTextCol}>
                      <Text
                        style={[
                          styles.progressStatValue,
                          { color: colors.warning },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        {remainingHabits}
                      </Text>
                      <Text
                        style={[
                          styles.progressStatLabel,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        Remaining
                      </Text>
                    </View>
                  </View>

                  {/* Best clean */}
                  {showBreakOnDashboard && breakHabits.length > 0 && (
                    <View
                      style={[
                        styles.progressStatItem,
                        { backgroundColor: colors.error + '15' },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={colors.error}
                      />
                      <View style={styles.progressStatTextCol}>
                        <Text
                          style={[
                            styles.progressStatValue,
                            { color: colors.error },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          {bestBreakStreak}
                        </Text>
                        <Text
                          style={[
                            styles.progressStatLabel,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {breakLabel}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Streak card ────────────────────────────────── */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <StreakCard currentStreak={currentStreak} bestStreak={currentStreak} />
          </Animated.View>

          {/* ── Quick actions ──────────────────────────────── */}
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
                          }),
                        },
                        { scale: quickActionsAnim[index] },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => router.push(action.route)}
                    accessibilityRole="button"
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
                        <Ionicons
                          name={action.icon as any}
                          size={26}
                          color="#fff"
                        />
                      </View>
                      <Text style={styles.quickTitle}>{action.title}</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* ── Habits you're breaking (gated by settings) ── */}
          {showBreakOnDashboard && breakHabits.length > 0 && (
            <Animated.View style={[styles.habitsSection, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={colors.error}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.text, marginBottom: 0, marginLeft: 6 },
                    ]}
                  >
                    Habits You're Breaking
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/habits?filter=break')}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>
                    See All
                  </Text>
                </Pressable>
              </View>

              {breakHabits.slice(0, 4).map((habit) => {
                const s = stats[habit.id];
                const daysClean = s?.days_clean ?? 0;
                const tint = streakTint(daysClean, colors);
                const costPerDay = (habit as any).cost_per_day ?? 0;
                const saved = costPerDay > 0 ? costPerDay * daysClean : 0;

                return (
                  <Pressable
                    key={habit.id}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.breakCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.breakIconBubble,
                        { backgroundColor: tint + '20' },
                      ]}
                    >
                      <Ionicons
                        name={(habit.icon as any) || 'shield-outline'}
                        size={20}
                        color={tint}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.breakName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {habit.name}
                      </Text>
                      <View style={styles.breakStatsRow}>
                        <View style={styles.breakStat}>
                          <Text
                            style={[styles.breakStatValue, { color: tint }]}
                          >
                            {daysClean}
                          </Text>
                          <Text
                            style={[
                              styles.breakStatLabel,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {daysClean === 1 ? 'day' : 'days'} clean
                          </Text>
                        </View>
                        <View style={styles.breakStat}>
                          <Text
                            style={[
                              styles.breakStatValue,
                              { color: colors.text },
                            ]}
                          >
                            {s?.total_urges ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.breakStatLabel,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            urges
                          </Text>
                        </View>
                        <View style={styles.breakStat}>
                          <Text
                            style={[
                              styles.breakStatValue,
                              { color: colors.text },
                            ]}
                          >
                            {s?.total_relapses ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.breakStatLabel,
                              { color: colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            relapses
                          </Text>
                        </View>
                      </View>
                      {saved > 0 && (
                        <Text
                          style={[
                            styles.breakSavings,
                            { color: colors.success },
                          ]}
                          numberOfLines={1}
                        >
                          {formatMoney(saved, currencySymbol)} saved
                        </Text>
                      )}
                    </View>

                    <View style={styles.breakActions}>
                      <Pressable
                        onPress={() => openLogModal(habit, 'urge')}
                        hitSlop={6}
                        accessibilityLabel={`Log urge for ${habit.name}`}
                        style={({ pressed }) => [
                          styles.breakActionBtn,
                          {
                            backgroundColor: colors.warning + '20',
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name="flame-outline"
                          size={18}
                          color={colors.warning}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => openLogModal(habit, 'relapse')}
                        hitSlop={6}
                        accessibilityLabel={`Log relapse for ${habit.name}`}
                        style={({ pressed }) => [
                          styles.breakActionBtn,
                          {
                            backgroundColor: colors.error + '20',
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={18}
                          color={colors.error}
                        />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* ── Today's routines ───────────────────────────── */}
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
                const progress =
                  routine.total_tasks > 0
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
                          }),
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
                        },
                      ]}
                    >
                      <View style={styles.routineHeader}>
                        <View
                          style={[
                            styles.routineIcon,
                            { backgroundColor: routine.color + '20' },
                          ]}
                        >
                          <Ionicons
                            name={routine.icon as any}
                            size={20}
                            color={routine.color}
                          />
                        </View>
                        <View style={styles.routineInfo}>
                          <Text
                            style={[styles.routineName, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {routine.name}
                          </Text>
                          <Text
                            style={[
                              styles.routineStats,
                              { color: colors.textMuted, paddingBottom: 4 },
                            ]}
                            numberOfLines={1}
                          >
                            {routine.completed_tasks} of {routine.total_tasks}{' '}
                            tasks
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.routinePercentBadge,
                            { backgroundColor: routine.color + '15' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.routinePercentText,
                              { color: routine.color },
                            ]}
                          >
                            {progress.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.routineProgressBar,
                          { backgroundColor: colors.border },
                        ]}
                      >
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

          {/* ── Today's build habits ───────────────────────── */}
          <Animated.View style={[styles.habitsSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Habits
              </Text>
              <Pressable onPress={() => router.push('/habits?filter=build')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See All
                </Text>
              </Pressable>
            </View>

            {buildHabits.length === 0 ? (
              <Pressable
                onPress={() => router.push('/habit/create')}
                style={[styles.emptyCard, { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={40}
                  color={colors.primary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Create your first habit
                </Text>
              </Pressable>
            ) : (
              buildHabits.slice(0, 5).map((habit, index) => {
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
                          }),
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
                          borderColor: isCompleted
                            ? colors.success
                            : colors.border + '50',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.habitIcon,
                          { backgroundColor: colors.primary + '15' },
                        ]}
                      >
                        <Ionicons
                          name={habit.icon as any}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.habitContent}>
                        <Text
                          style={[
                            styles.habitName,
                            {
                              color: colors.text,
                              textDecorationLine: isCompleted
                                ? 'line-through'
                                : 'none',
                              opacity: isCompleted ? 0.6 : 1,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {habit.name}
                        </Text>
                        <Text
                          style={[
                            styles.habitMeta,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {habit.frequency_type} • {habit.target_count}x
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleQuickComplete(habit.id)}
                        hitSlop={8}
                        accessibilityLabel={
                          isCompleted ? 'Mark as missed' : 'Mark as completed'
                        }
                        style={[
                          styles.completeButton,
                          {
                            backgroundColor: isCompleted
                              ? colors.success
                              : 'transparent',
                            borderColor: isCompleted
                              ? colors.success
                              : colors.border,
                            marginRight: 4,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isCompleted ? 'checkmark' : 'ellipse-outline'}
                          size={20}
                          color={isCompleted ? '#fff' : colors.textMuted}
                        />
                      </Pressable>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>

          {/* ── Quote ──────────────────────────────────────── */}
          <Animated.View style={[styles.quoteSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.quoteHeaderLeft}>
                <Ionicons name="sparkles" size={18} color={colors.warning} />
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      marginBottom: 0,
                      marginLeft: 8,
                    },
                  ]}
                >
                  Daily Inspiration
                </Text>
              </View>
              <Pressable
                onPress={refreshQuote}
                disabled={isRefreshingQuote}
                hitSlop={10}
                accessibilityLabel="Refresh quote"
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

      {/* ── Break log modal ─────────────────────────────── */}
      <Modal
        visible={logModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeLogModal}
      >
        <Pressable style={styles.logBackdrop} onPress={closeLogModal}>
          <Pressable
            style={[
              styles.logSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <Text style={[styles.logTitle, { color: colors.text }]}>
              {logModal.mode === 'urge' ? 'Log an urge' : 'Log a relapse'}
            </Text>
            <Text style={[styles.logSubtitle, { color: colors.textMuted }]}>
              {logModal.habit ? `For "${logModal.habit.name}"` : ''}
            </Text>

            {logModal.mode === 'urge' ? (
              <>
                <Text style={[styles.logLabel, { color: colors.text }]}>
                  Intensity
                </Text>
                <View style={styles.intensityRow}>
                  {URGES.map((v) => {
                    const active = logIntensity === v;
                    return (
                      <Pressable
                        key={v}
                        onPress={() => setLogIntensity(v)}
                        style={[
                          styles.intensityChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.primary + '10',
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? '#fff' : colors.text,
                            fontWeight: '700',
                          }}
                        >
                          {v}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.logLabel, { color: colors.text }]}>
                  Notes (optional)
                </Text>
                <TextInput
                  style={[
                    styles.logInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={logNotes}
                  onChangeText={setLogNotes}
                  placeholder="What triggered it?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </>
            ) : (
              <>
                <Text style={[styles.logLabel, { color: colors.text }]}>
                  What happened?
                </Text>
                <View style={styles.reasonChips}>
                  {RELAPSE_REASONS.map((r) => {
                    const active = logReason === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setLogReason(active ? '' : r)}
                        style={[
                          styles.reasonChip,
                          {
                            backgroundColor: active
                              ? colors.error
                              : colors.error + '10',
                            borderColor: active ? colors.error : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? '#fff' : colors.text,
                            fontWeight: '600',
                          }}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={[
                    styles.logInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={logReason}
                  onChangeText={setLogReason}
                  placeholder="Or type your own reason…"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            <View style={styles.logActions}>
              <Pressable
                onPress={closeLogModal}
                disabled={isSavingLog}
                style={({ pressed }) => [
                  styles.logBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={submitLog}
                disabled={isSavingLog}
                style={({ pressed }) => [
                  styles.logBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    opacity: pressed || isSavingLog ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {isSavingLog ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

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
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
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
  avatarImage: { width: 40, height: 40, borderRadius: 20 },

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
    gap: 10,
    marginTop: 20,
    width: '100%',
    flexWrap: 'wrap',
  },
  progressStatItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  progressStatTextCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  progressStatValue: { fontSize: 18, fontWeight: '700' },
  progressStatLabel: { fontSize: 11, marginTop: 1 },

  quickActionsSection: { paddingHorizontal: 16, marginTop: 28 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
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
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  routinesSection: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontWeight: '600' },
  routineCard: { padding: 14, borderRadius: 16, marginBottom: 12 },
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

  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  breakIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  breakStatsRow: { flexDirection: 'row', gap: 18 },
  breakStat: { alignItems: 'flex-start' },
  breakStatValue: { fontSize: 16, fontWeight: '800' },
  breakStatLabel: { fontSize: 10, fontWeight: '500' },
  breakSavings: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  breakActions: { flexDirection: 'row', gap: 6 },
  breakActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quoteSection: { paddingHorizontal: 20, marginTop: 28 },
  quoteHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  refreshQuoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  logSheet: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  logTitle: { fontSize: 18, fontWeight: '800' },
  logSubtitle: { fontSize: 12, marginBottom: 4 },
  logLabel: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  logInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  intensityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  intensityChip: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  logActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  logBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});