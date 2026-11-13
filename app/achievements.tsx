import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/theme/ThemeContext';
import { lightTheme } from '../src/theme';
import { useAchievementStore } from '../src/stores/achievementStore';
import { useHabitStore } from '../src/stores/habitStore';
import { AchievementCard } from '../src/components/AchievementCard';
import { Achievement, Habit } from '../src/types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

type Segment = 'all' | 'build' | 'break';

const SEGMENTS: { key: Segment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'build', label: 'Build', icon: 'checkmark-circle-outline' },
  { key: 'break', label: 'Break', icon: 'shield-outline' },
];

/**
 * Bucket an achievement into build / break / milestone.
 * Matches on either `achievement.category` or on known ID patterns,
 * so this works whether the achievement catalog has categories or not.
 */
function categorize(a: Achievement): 'build' | 'break' | 'milestone' {
  const cat = ((a as any).category ?? '').toString().toLowerCase();
  if (cat.includes('break') || cat.includes('quit') || cat.includes('streak_clean')) {
    return 'break';
  }
  if (cat.includes('build') || cat.includes('completion')) return 'build';

  const id = String(a.id).toLowerCase();
  if (id.includes('break') || id.includes('clean') || id.includes('quit') || id.includes('urge')) {
    return 'break';
  }
  return 'milestone';
}

/** Extract a numeric target from fields like `target_value`, `goal`, `threshold`. */
function targetOf(a: Achievement): number | null {
  const t =
    (a as any).target_value ??
    (a as any).target ??
    (a as any).goal ??
    (a as any).threshold ??
    null;
  return typeof t === 'number' ? t : null;
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
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
  const {
    achievements,
    userAchievements,
    unlockedIds,
    totalXp,
    userLevel,
    fetchAchievements,
    checkAndUnlock,
    isLoading,
  } = useAchievementStore();

  const {
    habits,
    stats: breakStats,
    fetchHabits,
    loadBreakHabits,
    refreshStats,
  } = useHabitStore();

  // ── Local state ──
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState<Segment>('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const hideBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
    animateIn();
    return () => {
      if (hideBannerTimer.current) clearTimeout(hideBannerTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived break-habit context ──
  const breakHabits = useMemo(
    () => habits.filter((h) => h.habit_type === 'break'),
    [habits]
  );
  const totalDaysClean = useMemo(
    () =>
      breakHabits.reduce((sum, h) => sum + (breakStats[h.id]?.days_clean ?? 0), 0),
    [breakHabits, breakStats]
  );
  const longestCleanStreak = useMemo(
    () =>
      breakHabits.reduce(
        (best, h) => Math.max(best, breakStats[h.id]?.days_clean ?? 0),
        0
      ),
    [breakHabits, breakStats]
  );
  const totalUrges = useMemo(
    () =>
      breakHabits.reduce((sum, h) => sum + (breakStats[h.id]?.total_urges ?? 0), 0),
    [breakHabits, breakStats]
  );

  // ── Animations ──
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

  const showBanner = (items: Achievement[]) => {
    if (!items.length) return;
    if (hideBannerTimer.current) clearTimeout(hideBannerTimer.current);
    setNewlyUnlocked(items);
    bannerAnim.setValue(0);
    Animated.timing(bannerAnim, {
      toValue: 1, duration: 400,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    hideBannerTimer.current = setTimeout(() => {
      Animated.timing(bannerAnim, {
        toValue: 0, duration: 300,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start(() => setNewlyUnlocked([]));
    }, 4000);
  };

  // ── Data ──
  const loadData = async () => {
    // Habits + break stats first — achievement checks depend on them.
    await Promise.all([fetchHabits(), loadBreakHabits()]);
    const breakOnes = habits.filter((h) => h.habit_type === 'break');
    await Promise.all(breakOnes.map((h) => refreshStats(h.id)));

    await fetchAchievements();

    // Now check & unlock. Some stores accept a scope/context param —
    // tolerate both shapes so this works whether or not your store
    // was updated to accept scoped data.
    const tryCheck = checkAndUnlock as any;
    let unlocked: Achievement[] = [];
    try {
      unlocked = await tryCheck({
        totalDaysClean,
        longestCleanStreak,
        totalUrges,
        breakHabitCount: breakHabits.length,
      });
      if (!Array.isArray(unlocked)) unlocked = [];
    } catch {
      // Fallback to zero-arg call
      try {
        unlocked = (await tryCheck()) ?? [];
      } catch {
        unlocked = [];
      }
    }

    if (unlocked.length > 0) showBanner(unlocked);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Derived values for stats header ──
  const unlockedCount = unlockedIds.size;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // ── Filtered + bucketed achievements ──
  const visibleAchievements = useMemo(() => {
    if (segment === 'all') return achievements;
    return achievements.filter((a) => categorize(a) === segment);
  }, [achievements, segment]);

  const buildCount = useMemo(
    () => achievements.filter((a) => categorize(a) === 'build').length,
    [achievements]
  );
  const breakCount = useMemo(
    () => achievements.filter((a) => categorize(a) === 'break').length,
    [achievements]
  );

  const unlockedInSegment = useMemo(() => {
    return visibleAchievements.filter((a) =>
      unlockedIds.has(a.id as any)
    ).length;
  }, [visibleAchievements, unlockedIds]);

  // ── Banner transform ──
  const bannerTranslate = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Achievements
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Track your progress and earn rewards
          </Text>
        </View>

        {/* Level Card */}
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelInfo}>
            <View style={styles.levelIcon}>
              <Ionicons name="trophy" size={32} color="#fff" />
            </View>
            <View style={styles.levelContent}>
              <Text style={styles.levelTitle}>Level {userLevel}</Text>
              <Text style={styles.levelSubtitle}>{totalXp} Total XP</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Achievement Progress</Text>
              <Text style={styles.progressPercent}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Break-habit summary strip */}
        {breakHabits.length > 0 && (
          <View
            style={[
              styles.breakSummary,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.breakSummaryItem}>
              <Ionicons name="shield-checkmark" size={18} color={colors.error} />
              <Text style={[styles.breakSummaryValue, { color: colors.text }]}>
                {longestCleanStreak}
              </Text>
              <Text style={[styles.breakSummaryLabel, { color: colors.textMuted }]}>
                best clean streak
              </Text>
            </View>
            <View style={[styles.breakSummaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.breakSummaryItem}>
              <Ionicons name="flame" size={18} color={colors.warning} />
              <Text style={[styles.breakSummaryValue, { color: colors.text }]}>
                {totalUrges}
              </Text>
              <Text style={[styles.breakSummaryLabel, { color: colors.textMuted }]}>
                urges resisted
              </Text>
            </View>
            <View style={[styles.breakSummaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.breakSummaryItem}>
              <Ionicons name="time" size={18} color={colors.primary} />
              <Text style={[styles.breakSummaryValue, { color: colors.text }]}>
                {totalDaysClean}
              </Text>
              <Text style={[styles.breakSummaryLabel, { color: colors.textMuted }]}>
                total days clean
              </Text>
            </View>
          </View>
        )}

        {/* Newly-unlocked banner */}
        {newlyUnlocked.length > 0 && (
          <Animated.View
            style={[
              styles.notificationCard,
              {
                backgroundColor: colors.success + '15',
                borderColor: colors.success + '40',
                opacity: bannerAnim,
                transform: [{ translateY: bannerTranslate }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={24} color={colors.success} />
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.success }]}>
                Achievement Unlocked!
              </Text>
              <Text style={[styles.notificationText, { color: colors.text }]}>
                {newlyUnlocked.map((a) => a.name).join(', ')}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Animated.timing(bannerAnim, {
                  toValue: 0, duration: 200, useNativeDriver: true,
                }).start(() => setNewlyUnlocked([]));
              }}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </Animated.View>
        )}

        {/* Segmented control */}
        <View style={[styles.segmentBar, { backgroundColor: colors.card }]}>
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            const count =
              s.key === 'all'
                ? achievements.length
                : s.key === 'build'
                ? buildCount
                : breakCount;
            if (s.key === 'break' && breakCount === 0) {
              // Still show the tab; empty state explains how to earn
            }
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
                  size={15}
                  color={active ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? '#fff' : colors.text },
                  ]}
                >
                  {s.label}
                  {count > 0 ? ` · ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {segment === 'all'
                ? 'All Achievements'
                : segment === 'build'
                ? 'Build Achievements'
                : 'Break Achievements'}
            </Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {unlockedInSegment}/{visibleAchievements.length}
            </Text>
          </View>

          {isLoading && visibleAchievements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="hourglass-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Loading achievements…
              </Text>
            </View>
          ) : visibleAchievements.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name={segment === 'break' ? 'shield-outline' : 'trophy-outline'}
                size={40}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {segment === 'break'
                  ? 'No break achievements yet'
                  : 'No achievements in this category'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {segment === 'break'
                  ? 'Stay clean for 1, 7, or 30 days — and resist urges — to unlock them.'
                  : 'Keep using the app to unlock more milestones.'}
              </Text>
            </View>
          ) : (
            visibleAchievements.map((achievement, index) => {
              const unlocked = unlockedIds.has(achievement.id as any);
              const unlockedAt = userAchievements.find(
                (ua) => String(ua.id) === String(achievement.id)
              )?.unlocked_at;

              // Progress hint for locked break achievements
              const target = targetOf(achievement);
              const isBreak = categorize(achievement) === 'break';
              const progressValue = isBreak
                ? target && target > 0
                  ? Math.min(
                      target,
                      Math.round((longestCleanStreak / target) * target)
                    )
                  : longestCleanStreak
                : null;

              return (
                <Animated.View
                  key={achievement.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 20],
                          outputRange: [0, 20 + index * 4],
                        }),
                      },
                    ],
                  }}
                >
                  <AchievementCard
                    achievement={achievement}
                    unlocked={unlocked}
                    unlockedAt={unlockedAt}
                    progress={
                      !unlocked && isBreak && target
                        ? { current: longestCleanStreak, target }
                        : undefined
                    }
                  />
                </Animated.View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },

  levelCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  levelInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  levelIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  levelContent: { flex: 1 },
  levelTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  levelSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  progressContainer: {
    paddingTop: 12, borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  progressText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  progressPercent: { fontSize: 13, color: '#fff', fontWeight: 'bold' },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

  breakSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  breakSummaryItem: {
    flex: 1, alignItems: 'center', gap: 2,
  },
  breakSummaryValue: { fontSize: 18, fontWeight: '800' },
  breakSummaryLabel: { fontSize: 10, textAlign: 'center' },
  breakSummaryDivider: { width: StyleSheet.hairlineWidth, height: 28 },

  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  notificationText: { fontSize: 13 },

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
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12, fontWeight: '700' },

  achievementsSection: { paddingHorizontal: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  sectionCount: { fontSize: 13, fontWeight: '600' },

  emptyState: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});