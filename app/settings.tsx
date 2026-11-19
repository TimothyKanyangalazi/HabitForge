import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { lightTheme } from '../src/theme';
import { useSettingsStore } from '../src/stores/settingsStore';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

interface BreakSettings {
  currencySymbol: string;
  logUrgeReminders: boolean;
  dailyCleanSummary: boolean;
  showBreakOnDashboard: boolean;
}

const DEFAULT_BREAK_SETTINGS: BreakSettings = {
  currencySymbol: 'MK',
  logUrgeReminders: true,
  dailyCleanSummary: true,
  showBreakOnDashboard: true,
};

const CURRENCY_CHOICES: { label: string; value: string }[] = [
  { label: 'MK', value: 'MK' },
  { label: '$', value: '$' },
  { label: '€', value: '€' },
  { label: '£', value: '£' },
  { label: 'R', value: 'R' },
];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  // ── Theme ──
  const themeCtx = useTheme();
  const { isDark, toggleTheme } = themeCtx;
  const theme: any = themeCtx?.theme ?? themeCtx ?? lightTheme;
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

  // ── Settings store ──
  const { settings, updateSettings } = useSettingsStore();

  // Read / coerce break settings with fallback so the screen never
  // crashes if the store hasn't been extended yet.
  const breakSettings: BreakSettings = {
    ...DEFAULT_BREAK_SETTINGS,
    ...(settings as any)?.breakSettings,
  };

  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sectionAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
    Animated.stagger(
      60,
      sectionAnims.map((a) =>
        Animated.spring(a, {
          toValue: 1, friction: 8, tension: 40, useNativeDriver: true,
        })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save helpers ──
  const persistBreak = async (
    key: keyof BreakSettings,
    value: BreakSettings[keyof BreakSettings]
  ) => {
    setSaving(key);
    setSaveError(null);
    try {
      // Store both the legacy flat fields (currencySymbol) and the
      // nested breakSettings bag so we're forward-compatible with
      // either shape the store chooses to adopt.
      const nextBreak = { ...breakSettings, [key]: value };
      await updateSettings({
        ...(settings as any),
        breakSettings: nextBreak,
        ...(key === 'currencySymbol' ? { currencySymbol: value } : {}),
      });
    } catch (e) {
      console.error('[settings] persist error:', e);
      setSaveError('Could not save this setting.');
    } finally {
      setSaving(null);
    }
  };

  const sectionProps = (index: number) => ({
    style: {
      opacity: sectionAnims[index],
      transform: [
        {
          translateY: sectionAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {saveError && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.error + '15', borderColor: colors.error },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {saveError}
            </Text>
          </View>
        )}

        {/* ── Appearance ────────────────────────────────────────── */}
        <Animated.View style={[styles.section, sectionProps(0)]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            APPEARANCE
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: '#9C27B015' }]}>
                <Ionicons
                  name={isDark ? 'moon' : 'moon-outline'}
                  size={22}
                  color="#9C27B0"
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Switch between light and dark theme
                </Text>
              </View>
              <Switch
                value={!!isDark}
                onValueChange={() => {
                  void toggleTheme().catch((error: unknown) => {
                    console.error('Error toggling theme:', error);
                    setSaveError('Could not save the theme setting.');
                  });
                }}
                trackColor={{ false: colors.border, true: '#9C27B080' }}
                thumbColor={isDark ? '#9C27B0' : '#f4f3f4'}
                accessibilityLabel="Toggle dark mode"
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Notifications ─────────────────────────────────────── */}
        <Animated.View style={[styles.section, sectionProps(1)]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            NOTIFICATIONS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Pressable
              onPress={() => router.push('/notifications-settings')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.settingItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Notification Settings
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Manage reminders and alerts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Break Habits ──────────────────────────────────────── */}
        <Animated.View style={[styles.section, sectionProps(2)]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            BREAK HABITS
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Currency */}
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.error + '15' },
                ]}
              >
                <Ionicons name="cash-outline" size={22} color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Currency symbol
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Used for daily cost of each break habit
                </Text>
              </View>
            </View>
            <View style={[styles.chipRow, { paddingHorizontal: 14, paddingBottom: 14 }]}>
              {CURRENCY_CHOICES.map((c) => {
                const active = breakSettings.currencySymbol === c.value;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => persistBreak('currencySymbol', c.value)}
                    disabled={saving === 'currencySymbol'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.primary + '10',
                        borderColor: active ? colors.primary : colors.border,
                        opacity: saving === 'currencySymbol' ? 0.6 : 1,
                      },
                    ]}
                  >
                    {saving === 'currencySymbol' && active ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text },
                        ]}
                      >
                        {c.label}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Divider color={colors.border} />

            {/* Log urge reminders */}
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.warning + '15' },
                ]}
              >
                <Ionicons name="flame-outline" size={22} color={colors.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Log urge reminders
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Gentle nudges to log strong urges
                </Text>
              </View>
              <Switch
                value={breakSettings.logUrgeReminders}
                onValueChange={(v) => persistBreak('logUrgeReminders', v)}
                disabled={saving === 'logUrgeReminders'}
                trackColor={{
                  false: colors.border,
                  true: colors.warning + '80',
                }}
                thumbColor={
                  breakSettings.logUrgeReminders ? colors.warning : '#f4f3f4'
                }
                accessibilityLabel="Toggle urge logging reminders"
              />
            </View>

            <Divider color={colors.border} />

            {/* Daily clean summary */}
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.success + '15' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={colors.success}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Daily clean summary
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Show days-clean summary in your daily digest
                </Text>
              </View>
              <Switch
                value={breakSettings.dailyCleanSummary}
                onValueChange={(v) => persistBreak('dailyCleanSummary', v)}
                disabled={saving === 'dailyCleanSummary'}
                trackColor={{
                  false: colors.border,
                  true: colors.success + '80',
                }}
                thumbColor={
                  breakSettings.dailyCleanSummary ? colors.success : '#f4f3f4'
                }
                accessibilityLabel="Toggle daily clean summary"
              />
            </View>

            <Divider color={colors.border} />

            {/* Show on dashboard */}
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Show break section on dashboard
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Hide if you only track build habits
                </Text>
              </View>
              <Switch
                value={breakSettings.showBreakOnDashboard}
                onValueChange={(v) => persistBreak('showBreakOnDashboard', v)}
                disabled={saving === 'showBreakOnDashboard'}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + '80',
                }}
                thumbColor={
                  breakSettings.showBreakOnDashboard
                    ? colors.primary
                    : '#f4f3f4'
                }
                accessibilityLabel="Toggle break section on dashboard"
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Data ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, sectionProps(3)]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            DATA
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Pressable
              onPress={() => router.push('/data-management')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.settingItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.success + '15' },
                ]}
              >
                <Ionicons
                  name="server-outline"
                  size={22}
                  color={colors.success}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Data Management
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Export, import, or reset data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Divider color={colors.border} />

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Export break-habit data',
                  'This will export all urges and relapses for your break habits as JSON.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Export',
                      onPress: () => router.push('/data-management?scope=break'),
                    },
                  ]
                )
              }
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.settingItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.warning + '15' },
                ]}
              >
                <Ionicons
                  name="flame-outline"
                  size={22}
                  color={colors.warning}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Export urges & relapses
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  JSON backup for your break-habit history
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── About ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, sectionProps(4)]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.warning + '15' },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.warning}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Version
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  HabitForge v{APP_VERSION}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Small presentational helper — a hairline divider between rows
// ─────────────────────────────────────────────────────────────

function Divider({ color }: { color: string }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: color,
        marginLeft: 66, // aligns with text start, not icon
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 12, fontWeight: '500' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700',
    letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4,
  },
  card: { borderRadius: 16, overflow: 'hidden' },

  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 12 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 52, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '700' },
});