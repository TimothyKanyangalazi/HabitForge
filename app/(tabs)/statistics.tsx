import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  RefreshControl,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { statisticsService } from '../../src/services/statisticsService';
import { BarChart } from '../../src/components/Charts/BarChart';
import { CalendarHeatmap } from '../../src/components/Charts/CalendarHeatmap';

const { width } = Dimensions.get('window');

type TabType = 'daily' | 'weekly' | 'monthly';
type ModeType = 'build' | 'break';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function safe<T>(p: Promise<T> | undefined, fallback: T): Promise<T> {
  if (!p) return fallback;
  try {
    const v = await p;
    return v ?? fallback;
  } catch (e) {
    console.warn('[statisticsService]', e);
    return fallback;
  }
}

function streakTint(days: number, colors: Record<string, string>): string {
  if (days <= 0) return colors.textMuted;
  if (days < 3) return colors.warning;
  if (days < 7) return colors.primary;
  return colors.success;
}

interface BreakOverview {
  total_habits: number;
  total_days_clean: number;
  longest_streak: { name: string; days: number } | null;
  total_urges: number;
  total_relapses: number;
  habits: Array<{
    id: number;
    name: string;
    icon: string;
    days_clean: number;
    total_urges: number;
    total_relapses: number;
    best_streak: number;
    cost_per_day?: number;
    time_per_day_minutes?: number;
  }>;
  relapse_reasons: Array<{ reason: string; count: number }>;
  urge_triggers: Array<{ trigger: string; count: number }>;
}

const EMPTY_BREAK: BreakOverview = {
  total_habits: 0,
  total_days_clean: 0,
  longest_streak: null,
  total_urges: 0,
  total_relapses: 0,
  habits: [],
  relapse_reasons: [],
  urge_triggers: [],
};

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function StatisticsScreen() {
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
    background: raw.background ?? '#F9FAFB',
    primary: raw.primary ?? '#3B82F6',
    success: raw.success ?? '#10B981',
    warning: raw.warning ?? '#F59E0B',
    error: raw.error ?? raw.danger ?? '#EF4444',
  };

  // ── State ──
  const [mode, setMode] = useState<ModeType>('build');
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    completed: 0,
    missed: 0,
  });
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [habitTrends, setHabitTrends] = useState<any[]>([]);
  const [excusePatterns, setExcusePatterns] = useState<any[]>([]);
  const [breakOverview, setBreakOverview] =
    useState<BreakOverview>(EMPTY_BREAK);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    animateIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(headerAnim, {
      toValue: 1, friction: 6, tension: 40, delay: 200, useNativeDriver: true,
    }).start();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Each call is independently safe — one broken service won't nuke the page.
      const [weekly, monthly, heatmap, trends, excuses, breakData] =
        await Promise.all([
          safe(statisticsService.getWeeklyStats?.(), []),
          safe(
            statisticsService.getMonthlyStats?.(),
            { total: 0, completed: 0, missed: 0 }
          ),
          safe(statisticsService.getHeatmapData?.(30), []),
          safe(statisticsService.getHabitTrends?.(), []),
          safe(statisticsService.getExcusePatterns?.(), []),
          // Optional new service method; returns EMPTY_BREAK until added
          safe(
            (statisticsService as any).getBreakHabitsOverview?.(),
            EMPTY_BREAK
          ),
        ]);

      setWeeklyData(weekly || []);
      setMonthlyStats(monthly || { total: 0, completed: 0, missed: 0 });
      setHeatmapData(heatmap || []);
      setHabitTrends(trends || []);
      setExcusePatterns(excuses || []);
      setBreakOverview(breakData || EMPTY_BREAK);
    } catch (e) {
      console.error('Error loading statistics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Derived values ──
  const bestDay = useMemo(() => {
    if (weeklyData.length === 0) return { label: '-', value: 0 };
    return weeklyData.reduce((best, cur) =>
      (cur?.value ?? 0) > (best?.value ?? 0) ? cur : best
    );
  }, [weeklyData]);

  const avgCompletion = useMemo(() => {
    if (weeklyData.length === 0) return 0;
    const sum = weeklyData.reduce((a, d) => a + (d?.value ?? 0), 0);
    return sum / weeklyData.length;
  }, [weeklyData]);

  const totalCompletedThisWeek = useMemo(
    () => weeklyData.reduce((a, d) => a + (d?.completed ?? 0), 0),
    [weeklyData]
  );

  const monthlySavings = useMemo(() => {
    return breakOverview.habits.reduce((total, h) => {
      const cost = h.cost_per_day ?? 0;
      return total + cost * h.days_clean;
    }, 0);
  }, [breakOverview.habits]);

  const monthlyMinutes = useMemo(() => {
    return breakOverview.habits.reduce((total, h) => {
      const mins = h.time_per_day_minutes ?? 0;
      return total + mins * h.days_clean;
    }, 0);
  }, [breakOverview.habits]);

  const bestBreakHabit = useMemo(() => {
    if (!breakOverview.habits.length) return null;
    return [...breakOverview.habits].sort(
      (a, b) => b.days_clean - a.days_clean
    )[0];
  }, [breakOverview.habits]);

  // ── Renderers ──

  const renderBuildTabs = () => {
    switch (activeTab) {
      case 'daily':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Today's Overview
            </Text>
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={[colors.success + '20', colors.success + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {monthlyStats.completed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Completed
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={[colors.error + '20', colors.error + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.error + '20' }]}>
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {monthlyStats.missed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Missed
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  Daily Insight
                </Text>
              </View>
              <Text style={[styles.insightText, { color: colors.textMuted }]}>
                {monthlyStats.completed > monthlyStats.missed
                  ? "Great job! You're completing more habits than missing them."
                  : 'Try to focus on completing at least one habit today.'}
              </Text>
            </View>
          </Animated.View>
        );

      case 'weekly':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Weekly Performance
            </Text>

            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Completion Rate
                </Text>
                <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
                  Last 7 days
                </Text>
              </View>
              <BarChart data={weeklyData} height={180} />
            </View>

            <View style={styles.statsGrid}>
              <LinearGradient
                colors={[colors.warning + '20', colors.warning + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="trophy" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {bestDay.label}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Best Day
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {avgCompletion.toFixed(0)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Avg Completion
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-done" size={24} color={colors.success} />
              <View style={styles.totalContent}>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {totalCompletedThisWeek}
                </Text>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                  Total habits completed this week
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'monthly':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Monthly Heatmap
            </Text>

            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Completion Heatmap
                </Text>
                <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
                  Last 30 days
                </Text>
              </View>
              <CalendarHeatmap data={heatmapData} days={30} />
            </View>

            <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
                Less
              </Text>
              {[0, 25, 50, 75, 100].map((v) => (
                <View
                  key={v}
                  style={[
                    styles.legendBox,
                    {
                      backgroundColor: v === 0 ? colors.border : colors.primary,
                      opacity: v === 0 ? 1 : 0.2 + (v / 100) * 0.8,
                    },
                  ]}
                />
              ))}
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
                More
              </Text>
            </View>
          </Animated.View>
        );
    }
  };

  const renderBreakOverview = () => {
    const tint = streakTint(
      bestBreakHabit?.days_clean ?? 0,
      colors as any
    );
    return (
      <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
        <Text style={[styles.tabTitle, { color: colors.text }]}>
          Breaking Overview
        </Text>

        {/* Hero card */}
        <LinearGradient
          colors={[colors.error + '20', colors.warning + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.breakHero}
        >
          <View style={styles.breakHeroRow}>
            <View
              style={[
                styles.breakHeroIcon,
                { backgroundColor: tint + '25' },
              ]}
            >
              <Ionicons name="shield-checkmark" size={28} color={tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.breakHeroLabel, { color: colors.textMuted }]}>
                {bestBreakHabit
                  ? `Longest current streak · ${bestBreakHabit.name}`
                  : 'No break habits yet'}
              </Text>
              <Text style={[styles.breakHeroValue, { color: tint }]}>
                {bestBreakHabit?.days_clean ?? 0}{' '}
                <Text style={{ fontSize: 16, fontWeight: '600' }}>
                  {(bestBreakHabit?.days_clean ?? 0) === 1 ? 'day' : 'days'} clean
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.breakHeroStats}>
            <View style={styles.breakHeroStat}>
              <Text style={[styles.breakHeroStatValue, { color: colors.text }]}>
                {breakOverview.total_habits}
              </Text>
              <Text style={[styles.breakHeroStatLabel, { color: colors.textMuted }]}>
                Tracking
              </Text>
            </View>
            <View style={styles.breakHeroStat}>
              <Text style={[styles.breakHeroStatValue, { color: colors.warning }]}>
                {breakOverview.total_urges}
              </Text>
              <Text style={[styles.breakHeroStatLabel, { color: colors.textMuted }]}>
                Urges logged
              </Text>
            </View>
            <View style={styles.breakHeroStat}>
              <Text style={[styles.breakHeroStatValue, { color: colors.error }]}>
                {breakOverview.total_relapses}
              </Text>
              <Text style={[styles.breakHeroStatLabel, { color: colors.textMuted }]}>
                Relapses
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Reclaimed value */}
        {(monthlySavings > 0 || monthlyMinutes > 0) && (
          <View style={styles.statsGrid}>
            {monthlySavings > 0 && (
              <LinearGradient
                colors={[colors.success + '20', colors.success + '05']}
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.success + '20' },
                  ]}
                >
                  <Ionicons name="cash" size={24} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {monthlySavings.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  saved
                </Text>
              </LinearGradient>
            )}
            {monthlyMinutes > 0 && (
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '05']}
                style={styles.statCard}
              >
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Ionicons name="hourglass" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(monthlyMinutes / 60)}h
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  reclaimed
                </Text>
              </LinearGradient>
            )}
          </View>
        )}

        {/* Per-habit breakdown */}
        {breakOverview.habits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Each Habit
              </Text>
              <Ionicons name="list-outline" size={20} color={colors.primary} />
            </View>
            {breakOverview.habits.map((h) => {
              const ht = streakTint(h.days_clean, colors as any);
              return (
                <View
                  key={h.id}
                  style={[styles.breakHabitRow, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.breakHabitIcon,
                      { backgroundColor: ht + '20' },
                    ]}
                  >
                    <Ionicons
                      name={(h.icon as any) || 'shield-outline'}
                      size={18}
                      color={ht}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.breakHabitName, { color: colors.text }]}>
                      {h.name}
                    </Text>
                    <View style={styles.breakHabitStats}>
                      <Text style={[styles.breakHabitStat, { color: ht }]}>
                        {h.days_clean} clean
                      </Text>
                      <Text style={[styles.breakHabitStat, { color: colors.textMuted }]}>
                        ·
                      </Text>
                      <Text
                        style={[styles.breakHabitStat, { color: colors.textMuted }]}
                      >
                        best {h.best_streak}d
                      </Text>
                      <Text style={[styles.breakHabitStat, { color: colors.textMuted }]}>
                        ·
                      </Text>
                      <Text
                        style={[styles.breakHabitStat, { color: colors.textMuted }]}
                      >
                        {h.total_urges} urges
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.breakHabitBadge,
                      {
                        backgroundColor:
                          h.total_relapses === 0
                            ? colors.success + '20'
                            : colors.error + '20',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          h.total_relapses === 0
                            ? colors.success
                            : colors.error,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {h.total_relapses === 0
                        ? 'On track'
                        : `${h.total_relapses} lapse${h.total_relapses === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Urge triggers */}
        {breakOverview.urge_triggers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Top Urge Triggers
              </Text>
              <Ionicons name="flame" size={20} color={colors.warning} />
            </View>
            <View style={[styles.excuseCard, { backgroundColor: colors.card }]}>
              {breakOverview.urge_triggers.slice(0, 5).map((t, i) => (
                <View key={`${t.trigger}-${i}`} style={styles.excuseItem}>
                  <View
                    style={[
                      styles.excuseIcon,
                      { backgroundColor: colors.warning + '10' },
                    ]}
                  >
                    <Ionicons name="flash" size={18} color={colors.warning} />
                  </View>
                  <Text style={[styles.excuseText, { color: colors.text }]}>
                    {t.trigger}
                  </Text>
                  <View
                    style={[
                      styles.excuseBadge,
                      { backgroundColor: colors.warning + '15' },
                    ]}
                  >
                    <Text style={[styles.excuseCount, { color: colors.warning }]}>
                      {t.count}x
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Relapse reasons */}
        {breakOverview.relapse_reasons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Relapse Reasons
              </Text>
              <Ionicons name="warning" size={20} color={colors.error} />
            </View>
            <View style={[styles.excuseCard, { backgroundColor: colors.card }]}>
              {breakOverview.relapse_reasons.slice(0, 5).map((r, i) => (
                <View key={`${r.reason}-${i}`} style={styles.excuseItem}>
                  <View
                    style={[
                      styles.excuseIcon,
                      { backgroundColor: colors.error + '10' },
                    ]}
                  >
                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                  </View>
                  <Text style={[styles.excuseText, { color: colors.text }]}>
                    {r.reason}
                  </Text>
                  <View
                    style={[
                      styles.excuseBadge,
                      { backgroundColor: colors.error + '15' },
                    ]}
                  >
                    <Text style={[styles.excuseCount, { color: colors.error }]}>
                      {r.count}x
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {breakOverview.habits.length === 0 && (
          <View
            style={[
              styles.emptyBreak,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="shield-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyBreakTitle, { color: colors.text }]}>
              No break habits yet
            </Text>
            <Text style={[styles.emptyBreakText, { color: colors.textMuted }]}>
              Create a break habit to start tracking days clean, urges, and
              relapses here.
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[styles.loadingSpinner, { borderColor: colors.primary }]}
        />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  // ── Render ──
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
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
          transform: [{ translateY: slideAnim }],
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
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Track your progress over time
          </Text>
        </Animated.View>

        {/* Build / Break mode selector */}
        <View style={[styles.modeSwitch, { backgroundColor: colors.card }]}>
          {(
            [
              { key: 'build', label: 'Build', icon: 'checkmark-circle-outline' },
              { key: 'break', label: 'Break', icon: 'shield-outline' },
            ] as { key: ModeType; label: string; icon: any }[]
          ).map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.modeTab,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={16}
                  color={active ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.modeText,
                    { color: active ? '#fff' : colors.text },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Build: Daily / Weekly / Monthly tabs */}
        {mode === 'build' && (
          <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
            {[
              { key: 'daily', label: 'Daily', icon: 'today-outline' },
              { key: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
              { key: 'monthly', label: 'Monthly', icon: 'grid-outline' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabType)}
                style={[
                  styles.tab,
                  activeTab === tab.key && {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.key ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? '#fff' : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Content */}
        {mode === 'build' ? renderBuildTabs() : renderBreakOverview()}

        {/* Build-only sections */}
        {mode === 'build' && habitTrends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Top Habits
              </Text>
              <Ionicons name="podium" size={20} color={colors.primary} />
            </View>
            {habitTrends.map((habit, index) => {
              const maxCount = habitTrends[0]?.completed_count || 1;
              const pct = ((habit.completed_count || 0) / maxCount) * 100;
              return (
                <View
                  key={index}
                  style={[styles.trendItem, { backgroundColor: colors.card }]}
                >
                  <View
                    style={[
                      styles.trendRank,
                      {
                        backgroundColor:
                          index === 0
                            ? colors.warning + '20'
                            : colors.primary + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trendRankText,
                        {
                          color: index === 0 ? colors.warning : colors.primary,
                        },
                      ]}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.trendIcon,
                      { backgroundColor: colors.primary + '10' },
                    ]}
                  >
                    <Ionicons
                      name={habit.icon as any}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.trendContent}>
                    <Text style={[styles.trendName, { color: colors.text }]}>
                      {habit.name}
                    </Text>
                    <View
                      style={[
                        styles.trendProgressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.trendProgressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor:
                              index === 0 ? colors.warning : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.trendCount, { color: colors.textMuted }]}>
                    {habit.completed_count || 0}x
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {mode === 'build' && excusePatterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Common Excuses
              </Text>
              <Ionicons name="warning" size={20} color={colors.error} />
            </View>
            <View style={[styles.excuseCard, { backgroundColor: colors.card }]}>
              {excusePatterns.map((excuse, index) => (
                <View key={index} style={styles.excuseItem}>
                  <View
                    style={[
                      styles.excuseIcon,
                      { backgroundColor: colors.error + '10' },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color={colors.error}
                    />
                  </View>
                  <Text style={[styles.excuseText, { color: colors.text }]}>
                    {excuse.text}
                  </Text>
                  <View
                    style={[
                      styles.excuseBadge,
                      { backgroundColor: colors.error + '15' },
                    ]}
                  >
                    <Text style={[styles.excuseCount, { color: colors.error }]}>
                      {excuse.count}x
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingSpinner: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 3,
    borderTopColor: 'transparent',
  },
  loadingText: { marginTop: 16, fontSize: 14 },

  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },

  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeText: { fontSize: 13, fontWeight: '700' },

  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
    borderRadius: 8, gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  tabContent: { paddingHorizontal: 20 },
  tabTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  chartCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  chartTitle: { fontSize: 15, fontWeight: '600' },
  chartSubtitle: { fontSize: 12 },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statIconContainer: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12 },

  insightCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  insightHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  insightTitle: { fontSize: 15, fontWeight: '600' },
  insightText: { fontSize: 13, lineHeight: 20 },

  totalCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 16, gap: 12,
  },
  totalContent: { flex: 1 },
  totalValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  totalLabel: { fontSize: 12 },

  legendContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 12,
    padding: 12, gap: 6,
  },
  legendLabel: { fontSize: 11 },
  legendBox: { width: 20, height: 20, borderRadius: 4 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },

  trendItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 8, gap: 10,
  },
  trendRank: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  trendRankText: { fontSize: 12, fontWeight: 'bold' },
  trendIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  trendContent: { flex: 1 },
  trendName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  trendProgressBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  trendProgressFill: { height: '100%', borderRadius: 2 },
  trendCount: { fontSize: 13, fontWeight: '600' },

  excuseCard: { borderRadius: 16, padding: 12 },
  excuseItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 10,
  },
  excuseIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  excuseText: { flex: 1, fontSize: 14 },
  excuseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  excuseCount: { fontSize: 12, fontWeight: 'bold' },

  // ── Break view styles ──
  breakHero: {
    borderRadius: 20, padding: 18, marginBottom: 16,
  },
  breakHeroRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
  },
  breakHeroIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  breakHeroLabel: { fontSize: 12, marginBottom: 4 },
  breakHeroValue: { fontSize: 28, fontWeight: '800' },
  breakHeroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 12,
  },
  breakHeroStat: { flex: 1, alignItems: 'flex-start' },
  breakHeroStatValue: { fontSize: 18, fontWeight: '800' },
  breakHeroStatLabel: { fontSize: 11, marginTop: 2 },

  breakHabitRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 8, gap: 10,
  },
  breakHabitIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  breakHabitName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  breakHabitStats: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  breakHabitStat: { fontSize: 12 },
  breakHabitBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },

  emptyBreak: {
    padding: 24, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', gap: 8, marginTop: 20,
  },
  emptyBreakTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyBreakText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});