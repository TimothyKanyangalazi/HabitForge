import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabitStore } from '../../src/stores/habitStore';
import { HabitCard } from '../../src/components/HabitCard/HabitCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { Habit, HabitType } from '../../src/types';
import { habitTemplates, HabitTemplate } from '../../src/templates/habitTemplates';

const DEFAULT_COLOR = '#3B82F6';
const DEFAULT_REMINDER = '09:00';

type Filter = 'all' | HabitType;

const FILTERS: { key: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'build', label: 'Build', icon: 'checkmark-circle-outline' },
  { key: 'break', label: 'Break', icon: 'shield-outline' },
];

const RELAPSE_REASON_PRESETS = ['Bored', 'Stressed', 'Social pressure', 'Tired', 'Celebrating'];
const URGE_INTENSITY_PICKS = [2, 4, 6, 8, 10];

// ── helpers ────────────────────────────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = (t || DEFAULT_REMINDER).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getHabitReminder(h: Habit): string {
  return (h.reminder_time as string) || (h as any).preferred_time || DEFAULT_REMINDER;
}

function streakColor(days: number, colors: Record<string, string>): string {
  if (days <= 0) return colors.textMuted;
  if (days < 3) return colors.warning ?? '#F59E0B';
  if (days < 7) return colors.primary;
  return colors.success ?? '#10B981';
}

export default function HabitsScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const textMuted = colors.textMuted ?? colors.textSecondary ?? '#6B7280';

  const {
    habits,
    todayLogs,
    stats,
    fetchHabits,
    loadBreakHabits,
    fetchTodayLogs,
    logHabit,
    archiveHabit,
    deleteHabit,
    createHabit,
    logUrge,
    logRelapse,
    refreshStats,
  } = useHabitStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<Filter>('all');

  // Log modal (urges / relapses)
  const [logModal, setLogModal] = useState<{
    visible: boolean;
    habit: Habit | null;
    mode: 'urge' | 'relapse';
  }>({ visible: false, habit: null, mode: 'urge' });
  const [logIntensity, setLogIntensity] = useState(6);
  const [logNotes, setLogNotes] = useState('');
  const [logReason, setLogReason] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const habitAnimMap = useRef<Map<number, Animated.Value>>(new Map()).current;

  const getHabitAnim = useCallback(
    (id: number): Animated.Value => {
      let anim = habitAnimMap.get(id);
      if (!anim) {
        anim = new Animated.Value(0);
        habitAnimMap.set(id, anim);
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
      return anim;
    },
    [habitAnimMap]
  );

  useEffect(() => {
    loadData();
    animateIn();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timeInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([fetchHabits(), loadBreakHabits(), fetchTodayLogs(today)]);

    // Refresh stats for every break habit
    const breakOnes = habits.filter((h) => h.habit_type === 'break');
    await Promise.all(breakOnes.map((h) => refreshStats(h.id)));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Build habit time helpers ──────────────────────────────────────
  const getTimeSlot = (habit: Habit): { slot: string; priority: number } => {
    const v = timeToMinutes(getHabitReminder(habit));
    if (v < 5 * 60) return { slot: 'Early Morning', priority: 1 };
    if (v < 12 * 60) return { slot: 'Morning', priority: 2 };
    if (v < 17 * 60) return { slot: 'Afternoon', priority: 3 };
    if (v < 21 * 60) return { slot: 'Evening', priority: 4 };
    return { slot: 'Night', priority: 5 };
  };

  const isHabitDueNow = (habit: Habit): boolean => {
    const now = new Date();
    const v = now.getHours() * 60 + now.getMinutes();
    return Math.abs(timeToMinutes(getHabitReminder(habit)) - v) <= 30;
  };

  const getSortedHabits = (list: Habit[]): Habit[] => {
    const build = list.filter((h) => h.habit_type !== 'break');
    const breakList = list.filter((h) => h.habit_type === 'break');

    build.sort(
      (a, b) => timeToMinutes(getHabitReminder(a)) - timeToMinutes(getHabitReminder(b))
    );

    breakList.sort((a, b) => {
      const sa = stats[a.id]?.days_clean ?? 0;
      const sb = stats[b.id]?.days_clean ?? 0;
      return sb - sa;
    });

    return [...build, ...breakList];
  };

  // ── build completion ─────────────────────────────────────────────
  const handleCompleteHabit = async (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    const currentLog = todayLogs[habit.id];

    const newStatus: 'completed' | 'missed' =
      currentLog?.status === 'completed' ? 'missed' : 'completed';

    try {
      await logHabit({
        habit_id: habit.id,
        log_date: today,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });

      if (newStatus === 'missed') {
        Alert.alert('Log Excuse', 'Would you like to log what stopped you?', [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Log Excuse',
            onPress: () =>
              router.push({
                pathname: '/excuses/create',
                params: { habitId: habit.id, habitName: habit.name },
              }),
          },
        ]);
      }
    } catch (error) {
      console.error('Error logging habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    }
  };

  // ── urge / relapse ───────────────────────────────────────────────
  const openLogModal = (habit: Habit, mode: 'urge' | 'relapse') => {
    setLogIntensity(6);
    setLogNotes('');
    setLogReason('');
    setLogModal({ visible: true, habit, mode });
  };

  const closeLogModal = () => {
    if (isSavingLog) return;
    setLogModal({ visible: false, habit: null, mode: 'urge' });
  };

  const submitLog = async () => {
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
          relapse_date: new Date().toISOString().split('T')[0],
          reason: logReason.trim() || logNotes.trim() || undefined,
        } as any);
      }
      await refreshStats(habit.id);
      closeLogModal();
    } catch (error) {
      console.error(`Error logging ${mode}:`, error);
      Alert.alert('Error', `Failed to log ${mode}. Please try again.`);
    } finally {
      setIsSavingLog(false);
    }
  };

  // ── templates ────────────────────────────────────────────────────
  const handleUseTemplate = async (template: HabitTemplate) => {
    Alert.alert('Add Template', `Add "${template.name}" to your habits?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: async () => {
          try {
            await createHabit({
              name: template.name,
              description: template.description,
              icon: template.icon,
              color: (template as any).color ?? DEFAULT_COLOR,
              frequency: ((template as any).frequency_type ?? 'daily') as any,
              target_count: template.target_count ?? 1,
              habit_type: ((template as any).habit_type ?? 'build') as HabitType,
            });
            setShowTemplates(false);
            Alert.alert('Success', `"${template.name}" has been added!`);
          } catch (error) {
            console.error('Error adding template:', error);
            Alert.alert('Error', 'Failed to add template habit.');
          }
        },
      },
    ]);
  };

  // ── shared options menu ─────────────────────────────────────────
  const showHabitOptions = (habit: Habit) => {
    const isBreak = habit.habit_type === 'break';
    Alert.alert(`Habit: ${habit.name}`, isBreak ? 'Break habit' : 'Build habit', [
      {
        text: 'Edit',
        onPress: () => router.push(`/habit/edit?id=${habit.id}`),
      },
      {
        text: 'Archive',
        onPress: () =>
          Alert.alert('Archive Habit', `Archive "${habit.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Archive',
              onPress: async () => {
                try {
                  await archiveHabit(habit.id);
                } catch {
                  Alert.alert('Error', 'Failed to archive habit.');
                }
              },
            },
          ]),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete Habit',
            `Delete "${habit.name}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteHabit(habit.id);
                  } catch {
                    Alert.alert('Error', 'Failed to delete habit.');
                  }
                },
              },
            ]
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── renderers ────────────────────────────────────────────────────
  const renderBuildHabit = (item: Habit) => {
    const timeSlot = getTimeSlot(item);
    const isDueNow = isHabitDueNow(item);
    const habitTime = getHabitReminder(item);
    return (
      <View style={styles.habitWrapper}>
        {isDueNow && (
          <View style={[styles.dueNowBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.dueNowText}>Due Now</Text>
          </View>
        )}
        <HabitCard
          habit={item}
          log={todayLogs[item.id]}
          onPress={() => router.push(`/habit/${item.id}`)}
          onComplete={() => handleCompleteHabit(item)}
          onLongPress={() => showHabitOptions(item)}
        />
        <View style={styles.timeIndicator}>
          <Ionicons name="time-outline" size={14} color={textMuted} />
          <Text style={[styles.timeText, { color: textMuted }]}>
            {habitTime} • {timeSlot.slot}
          </Text>
        </View>
      </View>
    );
  };

  const renderBreakHabit = (item: Habit) => {
    const habitStats = stats[item.id];
    const daysClean = habitStats?.days_clean ?? 0;
    const totalUrges = habitStats?.total_urges ?? 0;
    const totalRelapses = habitStats?.total_relapses ?? 0;
    const streakTint = streakColor(daysClean, colors);

    return (
      <Pressable
        onPress={() => router.push(`/habit/${item.id}`)}
        onLongPress={() => showHabitOptions(item)}
        style={({ pressed }) => [
          styles.breakCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.breakIconBubble,
            { backgroundColor: `${streakTint}22` },
          ]}
        >
          <Ionicons
            name={(item.icon as any) || 'shield-outline'}
            size={22}
            color={streakTint}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.breakName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.breakStatsRow}>
            <View style={styles.breakStat}>
              <Text style={[styles.breakStatValue, { color: streakTint }]}>
                {daysClean}
              </Text>
              <Text style={[styles.breakStatLabel, { color: textMuted }]}>
                {daysClean === 1 ? 'day' : 'days'} clean
              </Text>
            </View>
            <View style={styles.breakStat}>
              <Text style={[styles.breakStatValue, { color: colors.text }]}>
                {totalUrges}
              </Text>
              <Text style={[styles.breakStatLabel, { color: textMuted }]}>urges</Text>
            </View>
            <View style={styles.breakStat}>
              <Text style={[styles.breakStatValue, { color: colors.text }]}>
                {totalRelapses}
              </Text>
              <Text style={[styles.breakStatLabel, { color: textMuted }]}>relapses</Text>
            </View>
          </View>
        </View>

        <View style={styles.breakActions}>
          <Pressable
            onPress={() => openLogModal(item, 'urge')}
            hitSlop={6}
            accessibilityLabel={`Log urge for ${item.name}`}
            style={({ pressed }) => [
              styles.breakActionBtn,
              {
                backgroundColor: `${colors.warning ?? '#F59E0B'}20`,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="flame-outline"
              size={18}
              color={colors.warning ?? '#F59E0B'}
            />
          </Pressable>
          <Pressable
            onPress={() => openLogModal(item, 'relapse')}
            hitSlop={6}
            accessibilityLabel={`Log relapse for ${item.name}`}
            style={({ pressed }) => [
              styles.breakActionBtn,
              {
                backgroundColor: `${colors.error ?? '#EF4444'}20`,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.error ?? '#EF4444'}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const anim = getHabitAnim(item.id);
    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        }}
      >
        {item.habit_type === 'break' ? renderBreakHabit(item) : renderBuildHabit(item)}
      </Animated.View>
    );
  };

  // ── data ────────────────────────────────────────────────────────
  const categories = ['All', ...new Set(habitTemplates.map((t) => t.category))];
  const filteredTemplates =
    selectedCategory === 'All'
      ? habitTemplates
      : habitTemplates.filter((t) => t.category === selectedCategory);

  const buildHabits = habits.filter((h) => h.habit_type !== 'break');
  const breakHabits = habits.filter((h) => h.habit_type === 'break');
  const completedCount = buildHabits.filter(
    (h) => todayLogs[h.id]?.status === 'completed'
  ).length;

  const visibleHabits = useMemo(() => {
    const filtered =
      filter === 'all' ? habits : habits.filter((h) => h.habit_type === filter);
    return getSortedHabits(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, filter, stats, todayLogs]);

  const currentTimeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderTemplateItem = ({ item }: { item: HabitTemplate }) => (
    <Pressable
      onPress={() => handleUseTemplate(item)}
      style={({ pressed }) => [
        styles.templateItem,
        {
          backgroundColor: colors.card,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '10']}
        style={styles.templateIcon}
      >
        <Ionicons name={item.icon as any} size={24} color={colors.primary} />
      </LinearGradient>
      <View style={styles.templateContent}>
        <Text style={[styles.templateName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.templateDescription, { color: textMuted }]}>
          {item.description}
        </Text>
        <View style={styles.templateMeta}>
          <View
            style={[
              styles.templateCategoryBadge,
              { backgroundColor: colors.primary + '10' },
            ]}
          >
            <Text style={[styles.templateCategory, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
          <Text style={[styles.templateFrequency, { color: textMuted }]}>
            {(item as any).habit_type === 'break' ? 'Break' : 'Build'} •{' '}
            {(item as any).frequency_type ?? 'daily'} • {item.target_count ?? 1}x
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => handleUseTemplate(item)}
        style={({ pressed }) => [
          styles.addTemplateButton,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>My Habits</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            {completedCount} of {buildHabits.length} done
            {breakHabits.length > 0 ? ` · ${breakHabits.length} breaking` : ''}
          </Text>
          <View style={styles.currentTimeContainer}>
            <Ionicons name="time" size={14} color={colors.primary} />
            <Text style={[styles.currentTimeText, { color: colors.primary }]}>
              {currentTimeString}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTemplates(true)}
            style={({ pressed }) => [
              styles.templateButton,
              {
                backgroundColor: colors.card,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <Ionicons name="albums-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/habit/create')}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.9 : 1 }] }]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary ?? colors.primary]}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Filter tabs ────────────────────────────────────────── */}
      <View style={styles.filterTabs}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={active ? '#fff' : textMuted}
              />
              <Text
                style={[
                  styles.filterTabText,
                  { color: active ? '#fff' : colors.text },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── List ───────────────────────────────────────────────── */}
      <FlatList
        data={visibleHabits}
        renderItem={renderHabit}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Ionicons
                name={
                  filter === 'break'
                    ? 'shield-outline'
                    : 'checkmark-circle-outline'
                }
                size={48}
                color={textMuted}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {filter === 'break'
                ? 'No Break Habits Yet'
                : filter === 'build'
                ? 'No Build Habits Yet'
                : 'No Habits Yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: textMuted }]}>
              {filter === 'break'
                ? 'Break a habit you want to stop — smoking, doom-scrolling, late nights.'
                : 'Create a habit or use a template to get started'}
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() =>
                  router.push(
                    filter === 'break' ? '/habit/create?type=break' : '/habit/create'
                  )
                }
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary ?? colors.primary]}
                  style={styles.emptyButton}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Create Habit</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => setShowTemplates(true)}
                style={({ pressed }) => [
                  styles.emptyButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderWidth: 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Ionicons name="albums-outline" size={20} color={colors.primary} />
                <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
                  Templates
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />

      {/* ── Templates modal ───────────────────────────────────── */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Habit Templates
              </Text>
              <Text style={[styles.modalSubtitle, { color: textMuted }]}>
                Choose a pre-built habit to get started
              </Text>
            </View>
            <Pressable
              onPress={() => setShowTemplates(false)}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === category ? colors.primary : colors.card,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selectedCategory === category ? '#fff' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={filteredTemplates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.templateList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  No templates in this category
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* ── Log urge / relapse modal ──────────────────────────── */}
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
            <Text style={[styles.logSubtitle, { color: textMuted }]}>
              {logModal.habit ? `For "${logModal.habit.name}"` : ''}
            </Text>

            {logModal.mode === 'urge' ? (
              <>
                <Text style={[styles.logLabel, { color: colors.text }]}>
                  Intensity
                </Text>
                <View style={styles.intensityRow}>
                  {URGE_INTENSITY_PICKS.map((v) => {
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
                              : `${colors.primary}10`,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
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
                  placeholderTextColor={textMuted}
                  multiline
                />
              </>
            ) : (
              <>
                <Text style={[styles.logLabel, { color: colors.text }]}>
                  What happened?
                </Text>
                <View style={styles.reasonChips}>
                  {RELAPSE_REASON_PRESETS.map((r) => {
                    const active = logReason === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setLogReason(active ? '' : r)}
                        style={[
                          styles.reasonChip,
                          {
                            backgroundColor: active
                              ? colors.error ?? '#EF4444'
                              : `${colors.error ?? '#EF4444'}10`,
                            borderColor: active
                              ? colors.error ?? '#EF4444'
                              : colors.border,
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
                  placeholderTextColor={textMuted}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  currentTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  currentTimeText: { fontSize: 13, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  templateButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingBottom: 100 },
  habitWrapper: { position: 'relative' },
  dueNowBadge: {
    position: 'absolute', top: 8, right: 16, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, gap: 4,
  },
  dueNowText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  timeIndicator: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 8, gap: 4,
  },
  timeText: { fontSize: 12, fontWeight: '500' },

  // ── Break habit card ─────────────────────────────────────
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  breakIconBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  breakName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  breakStatsRow: { flexDirection: 'row', gap: 18 },
  breakStat: { alignItems: 'flex-start' },
  breakStatValue: { fontSize: 16, fontWeight: '800' },
  breakStatLabel: { fontSize: 10, fontWeight: '500' },
  breakActions: { flexDirection: 'row', gap: 6 },
  breakActionBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Empty ────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyActions: { flexDirection: 'row', gap: 12 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 25, gap: 8,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },

  // ── Templates modal ──────────────────────────────────────
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16,
  },
  modalTitle: { fontSize: 28, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, marginTop: 4 },
  closeButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryContainer: { flexGrow: 0, marginBottom: 16 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  templateList: { paddingHorizontal: 20, paddingBottom: 20 },
  templateItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  templateIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  templateContent: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  templateDescription: { fontSize: 13, marginBottom: 8 },
  templateMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  templateCategoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  templateCategory: { fontSize: 11, fontWeight: '600' },
  templateFrequency: { fontSize: 11 },
  addTemplateButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  // ── Log modal ────────────────────────────────────────────
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
    minWidth: 44, height: 44, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  reasonChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reasonChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
  },
  logActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  logBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
});