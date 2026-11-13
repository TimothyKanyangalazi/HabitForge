import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/theme/ThemeContext';
import { lightTheme } from '../src/theme';
import { statisticsService } from '../src/services/statisticsService';
import { useHabitStore } from '../src/stores/habitStore';
import { useRoutineStore } from '../src/stores/routineStore';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function safe<T>(p: Promise<T> | undefined, fallback: T): Promise<T> {
  if (!p) return fallback;
  try {
    const v = await p;
    return v ?? fallback;
  } catch (e) {
    console.warn('[streaks] service error:', e);
    return fallback;
  }
}

type Segment = 'all' | 'build' | 'break';

const SEGMENTS: { key: Segment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'build', label: 'Build', icon: 'checkmark-circle-outline' },
  { key: 'break', label: 'Break', icon: 'shield-outline' },
];

/** Milestones to unlock — parameterized by a per-segment streak target. */
const BUILD_MILESTONES = [
  { days: 7,   icon: 'flame',  label: '7 Day Streak',   color: '#FF6B6B' },
  { days: 14,  icon: 'flame',  label: '14 Day Streak',  color: '#FF8E53' },
  { days: 30,  icon: 'trophy', label: '30 Day Streak',  color: '#FFD700' },
  { days: 60,  icon: 'trophy', label: '60 Day Streak',  color: '#FFA500' },
  { days: 100, icon: 'diamond', label: '100 Day Streak', color: '#9C27B0' },
  { days: 365, icon: 'crown',  label: '365 Day Streak', color: '#FFD700' },
] as const;

const CLEAN_MILESTONES = [
  { days: 1,   icon: 'shield-checkmark-outline', label: 'First Day Clean', color: '#22C55E' },
  { days: 7,   icon: 'shield-checkmark',         label: '7 Days Clean',    color: '#10B981' },
  { days: 30,  icon: 'shield',                   label: '30 Days Clean',   color: '#3B82F6' },
  { days: 90,  icon: 'ribbon',                   label: '90 Days Clean',   color: '#8B5CF6' },
  { days: 180, icon: 'medal',                    label: '6 Months Clean',  color: '#F59E0B' },
  { days: 365, icon: 'trophy',                   label: '1 Year Clean',    color: '#F97316' },
] as const;

function streakTint(days: number, colors: Record<string, string>): string {
  if (days <= 0) return colors.textMuted;
  if (days < 3) return colors.warning;
  if (days < 7) return colors.primary;
  return colors.success;
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function StreaksScreen() {
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

  // ── Stores ──
  const { habits, stats: breakStats, fetchHabits, loadBreakHabits, refreshStats } =
    useHabitStore();
  const { routines, fetchRoutines } = useRoutineStore();

  // ── Local state ──
  const [segment, setSegment] = useState<Segment>('all');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [habitStreaks, setHabitStreaks] = useState<any[]>([]);
  const [routineStreaks, setRoutineStreaks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
  };

  // ── Data ──
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Habits first, so break stats are ready for the per-habit section
      await Promise.all([fetchHabits(), loadBreakHabits(), fetchRoutines()]);

      const breakHabitList = habits.filter((h) => h.habit_type === 'break');
      await Promise.all(breakHabitList.map((h) => refreshStats(h.id)));

      const [current, longest, habitStreakData, routineStreakData] =
        await Promise.all([
          safe(statisticsService.getCurrentStreak?.(), 0),
          safe(statisticsService.getLongestStreak?.(), 0),
          safe(statisticsService.getHabitStreaks?.(), []),
          safe(statisticsService.getRoutineStreaks?.(), []),
        ]);

      setCurrentStreak(current || 0);
      setLongestStreak(longest || 0);
      setHabitStreaks(habitStreakData || []);
      setRoutineStreaks(routineStreakData || []);
    } catch (e) {
      console.error('Error loading streaks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Derived break + build view-models ──
  const breakHabits = useMemo(
    () => habits.filter((h) => h.habit_type === 'break'),
    [habits]
  );

  const breakStreakCards = useMemo(() => {
    return breakHabits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: colors.error,
      current_streak: breakStats[h.id]?.days_clean ?? 0,
      best_streak: breakStats[h.id]?.best_streak ?? 0,
      total_urges: breakStats[h.id]?.total_urges ?? 0,
      total_relapses: breakStats[h.id]?.total_relapses ?? 0,
    }));
  }, [breakHabits, breakStats, colors.error]);

  const buildStreakCards = useMemo(
    () =>
      habitStreaks.filter((h) => {
        const match = habits.find((x) => x.id === h.id);
        return match ? match.habit_type !== 'break' : true;
      }),
    [habitStreaks, habits]
  );

  const bestBreakStreak = useMemo(
    () => breakStreakCards.reduce((max, h) => Math.max(max, h.current_streak), 0),
    [breakStreakCards]
  );
  const bestBreakRecord = useMemo(
    () => breakStreakCards.reduce((max, h) => Math.max(max, h.best_streak), 0),
    [breakStreakCards]
  );

  const heroStreak =
    segment === 'break' ? bestBreakStreak : currentStreak;
  const heroBest =
    segment === 'break' ? bestBreakRecord : longestStreak;
  const heroLabel =
    segment === 'break' ? 'Best Current Clean' : 'Current Streak';
  const heroBestLabel =
    segment === 'break' ? 'Personal Clean Record' : 'Longest Streak';
  const heroSubLabel = segment === 'break' ? 'Days clean' : 'Days in a row';

  // ── Visible sections per segment ──
  const showBuildSection = segment !== 'break';
  const showBreakSection = segment !== 'build';
  const showRoutines = segment === 'all';

  const milestones = segment === 'break' ? CLEAN_MILESTONES : BUILD_MILESTONES;
  const milestoneBasis =
    segment === 'break' ? bestBreakRecord : longestStreak;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Streaks</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading streaks…
          </Text>
        </View>
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
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Streaks</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Segment control */}
        <View style={[styles.segmentBar, { backgroundColor: colors.card }]}>
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSegment(s.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.segmentTab,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={s.icon}
                  size={14}
                  color={active ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? '#fff' : colors.text },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hero streak cards */}
        <View style={styles.mainStreakContainer}>
          <LinearGradient
            colors={
              segment === 'break'
                ? ['#EF4444', '#F59E0B']
                : ['#FF6B6B', '#FF8E53']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStreakCard}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={segment === 'break' ? 'shield-checkmark' : 'flame'}
                size={40}
                color="#fff"
              />
            </View>
            <Text style={styles.mainStreakValue}>{heroStreak}</Text>
            <Text style={styles.mainStreakLabel}>{heroLabel}</Text>
            <Text style={styles.mainStreakSubtext}>{heroSubLabel}</Text>
          </LinearGradient>

          <LinearGradient
            colors={
              segment === 'break'
                ? ['#8B5CF6', '#3B82F6']
                : ['#FFD700', '#FFA500']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStreakCard}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={segment === 'break' ? 'ribbon' : 'trophy'}
                size={40}
                color="#fff"
              />
            </View>
            <Text style={styles.mainStreakValue}>{heroBest}</Text>
            <Text style={styles.mainStreakLabel}>{heroBestLabel}</Text>
            <Text style={styles.mainStreakSubtext}>Personal best</Text>
          </LinearGradient>
        </View>

        {/* Milestones */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {segment === 'break' ? 'Clean Streak Milestones' : 'Streak Achievements'}
          </Text>

          <View style={styles.achievementList}>
            {milestones.map((m) => {
              const achieved = milestoneBasis >= m.days;
              return (
                <View
                  key={m.days}
                  style={[
                    styles.achievementItem,
                    {
                      backgroundColor: colors.card,
                      opacity: achieved ? 1 : 0.6,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: m.color + '22' },
                    ]}
                  >
                    <Ionicons
                      name={achieved ? (m.icon as any) : 'lock-closed'}
                      size={24}
                      color={achieved ? m.color : colors.textMuted}
                    />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text
                      style={[styles.achievementLabel, { color: colors.text }]}
                    >
                      {m.label}
                    </Text>
                    <Text
                      style={[
                        styles.achievementSubtext,
                        { color: colors.textMuted },
                      ]}
                    >
                      {achieved
                        ? 'Achieved!'
                        : `${m.days - milestoneBasis} days to go`}
                    </Text>
                  </View>
                  {achieved && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.success}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Build-habit streaks */}
        {showBuildSection && buildStreakCards.length > 0 && (
          <View style={styles.habitStreaksSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 6 }]}>
                  Build Habit Streaks
                </Text>
              </View>
            </View>

            {buildStreakCards.map((habit, index) => (
              <Pressable
                key={`${habit.id ?? habit.name}-${index}`}
                onPress={() => habit.id && router.push(`/habit/${habit.id}`)}
                style={({ pressed }) => [
                  styles.habitStreakItem,
                  {
                    backgroundColor: colors.card,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
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
                    name={(habit.icon as any) || 'checkmark'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.habitContent}>
                  <Text style={[styles.habitName, { color: colors.text }]}>
                    {habit.name}
                  </Text>
                  <Text
                    style={[
                      styles.habitStreakText,
                      { color: colors.textMuted },
                    ]}
                  >
                    {habit.current_streak || 0} day streak
                  </Text>
                </View>
                <View
                  style={[
                    styles.habitStreakBadge,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Ionicons name="flame" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.habitStreakCount,
                      { color: colors.primary },
                    ]}
                  >
                    {habit.current_streak || 0}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Break-habit clean streaks */}
        {showBreakSection && breakStreakCards.length > 0 && (
          <View style={styles.habitStreaksSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="shield-checkmark" size={18} color={colors.error} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 6 }]}>
                  Clean Streaks
                </Text>
              </View>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {breakStreakCards.length} tracking
              </Text>
            </View>

            {breakStreakCards.map((habit) => {
              const tint = streakTint(habit.current_streak, colors as any);
              return (
                <Pressable
                  key={`break-${habit.id}`}
                  onPress={() => router.push(`/habit/${habit.id}`)}
                  style={({ pressed }) => [
                    styles.breakStreakItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.breakIcon,
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
                    <View style={styles.breakMetaRow}>
                      <Text
                        style={[
                          styles.breakMetaText,
                          { color: colors.textMuted },
                        ]}
                      >
                        best {habit.best_streak}d
                      </Text>
                      <Text
                        style={[styles.dot, { color: colors.textMuted }]}
                      >
                        ·
                      </Text>
                      <Text
                        style={[
                          styles.breakMetaText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {habit.total_urges} urges
                      </Text>
                      {habit.total_relapses > 0 && (
                        <>
                          <Text
                            style={[styles.dot, { color: colors.textMuted }]}
                          >
                            ·
                          </Text>
                          <Text
                            style={[
                              styles.breakMetaText,
                              { color: colors.error },
                            ]}
                          >
                            {habit.total_relapses} lapse
                            {habit.total_relapses === 1 ? '' : 's'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.breakBadge,
                      { backgroundColor: tint + '20' },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color={tint}
                    />
                    <Text style={[styles.breakBadgeText, { color: tint }]}>
                      {habit.current_streak}d
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Routines (only in 'all') */}
        {showRoutines && routineStreaks.length > 0 && (
          <View style={styles.routineStreaksSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Routine Streaks
            </Text>

            {routineStreaks.map((routine, index) => (
              <View
                key={index}
                style={[
                  styles.routineStreakItem,
                  { backgroundColor: routine.color || colors.primary },
                ]}
              >
                <View style={styles.routineIcon}>
                  <Ionicons name={routine.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineStreakText}>
                    {routine.current_streak || 0} day streak
                  </Text>
                </View>
                <View style={styles.routineStreakBadge}>
                  <Ionicons name="flame" size={16} color="#fff" />
                  <Text style={styles.routineStreakCount}>
                    {routine.current_streak || 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state per segment */}
        {segment === 'break' && breakStreakCards.length === 0 && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="shield-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No break habits yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Create a break habit to start tracking days clean here.
            </Text>
            <Pressable
              onPress={() => router.push('/habit/create?type=break')}
              style={({ pressed }) => [
                styles.emptyCta,
                {
                  backgroundColor: colors.error,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyCtaText}>Create break habit</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  loadingText: { marginTop: 12, fontSize: 13 },

  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12, fontWeight: '700' },

  mainStreakContainer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginBottom: 24,
  },
  mainStreakCard: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  iconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  mainStreakValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  mainStreakLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginTop: 4 },
  mainStreakSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  achievementsSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionCount: { fontSize: 12, fontWeight: '600' },

  achievementList: { gap: 8 },
  achievementItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, gap: 12,
  },
  achievementIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementContent: { flex: 1 },
  achievementLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  achievementSubtext: { fontSize: 12 },

  habitStreaksSection: { paddingHorizontal: 20, marginBottom: 24 },
  habitStreakItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8, gap: 12,
  },
  habitIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  habitContent: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  habitStreakText: { fontSize: 12 },
  habitStreakBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, gap: 4,
  },
  habitStreakCount: { fontSize: 14, fontWeight: 'bold' },

  breakStreakItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, gap: 12,
  },
  breakIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  breakName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  breakMetaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  breakMetaText: { fontSize: 11, fontWeight: '500' },
  dot: { fontSize: 11 },
  breakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  breakBadgeText: { fontSize: 13, fontWeight: '800' },

  routineStreaksSection: { paddingHorizontal: 20, marginBottom: 24 },
  routineStreakItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8, gap: 12,
  },
  routineIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  routineContent: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  routineStreakText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  routineStreakBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', gap: 4,
  },
  routineStreakCount: { fontSize: 14, fontWeight: 'bold', color: '#fff' },

  emptyState: {
    marginHorizontal: 20,
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});