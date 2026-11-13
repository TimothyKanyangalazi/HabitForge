import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { lightTheme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  BREAK_PRESETS,
  MAX_REASON_LENGTH,
  MAX_REPLACEMENT_LENGTH,
} from '../constants/breakHabit';

// ─────────────────────────────────────────────────────────────
// Settings-aware helpers
// ─────────────────────────────────────────────────────────────

export function useCurrencySymbol(fallback = 'MK'): string {
  const { settings } = useSettingsStore() as any;
  return (
    settings?.breakSettings?.currencySymbol ??
    settings?.currencySymbol ??
    fallback
  );
}

export function useBreakSettings() {
  const { settings } = useSettingsStore() as any;
  return {
    currencySymbol:
      settings?.breakSettings?.currencySymbol ??
      settings?.currencySymbol ??
      'MK',
    logUrgeReminders: settings?.breakSettings?.logUrgeReminders ?? true,
    dailyCleanSummary: settings?.breakSettings?.dailyCleanSummary ?? true,
    showBreakOnDashboard:
      settings?.breakSettings?.showBreakOnDashboard ?? true,
  };
}

// ─────────────────────────────────────────────────────────────
// Color tokens — dark-mode-safe, contrast-aware
// ─────────────────────────────────────────────────────────────

/**
 * Hex #RRGGBB → { r, g, b }. Returns null for non-hex (e.g. 'transparent',
 * rgba strings), which callers treat as "unknown — assume light".
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** Perceived luminance in 0..1 (sRGB-ish, good enough for contrast checks). */
function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { r, g, b } = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Pick the first color that reads well against `bg`. */
function contrastText(bg: string, prefer: string, fallback = '#FFFFFF'): string {
  const lum = luminance(bg);
  if (lum === null) return prefer;
  // If prefer would clash, fall back to black/white.
  const pLum = luminance(prefer);
  if (pLum === null) return fallback;
  if (Math.abs(lum - pLum) < 0.25) {
    return lum > 0.55 ? '#111827' : '#F9FAFB';
  }
  return prefer;
}

/**
 * Blend a hex color with a base at a given alpha (0..1).
 * Avoids the "primary + '1F'" trick that breaks when primary has alpha,
 * and guarantees an opaque result so the chip stays readable.
 */
function blend(fg: string, bg: string, alpha: number): string {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return fg;
  const mix = (x: number, y: number) => Math.round(x * alpha + y * (1 - alpha));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(a.r, b.r))}${toHex(mix(a.g, b.g))}${toHex(mix(a.b, b.b))}`;
}

interface ColorTokens {
  // base
  isDark: boolean;
  background: string;
  surface: string;          // card background
  surfaceRaised: string;    // slightly lighter than surface (chips)
  surfaceSunken: string;    // slightly darker than surface (inputs)
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;    // text that sits on top of primary
  // brand
  primary: string;
  primarySoft: string;      // opaque blend of primary + surface
  error: string;
  success: string;
  warning: string;
  // composites
  chipSelectedBg: string;
  chipSelectedBorder: string;
  chipSelectedText: string;
  inputBg: string;
  previewBg: string;
  previewBorder: string;
  switchTrackOn: string;
  switchTrackOff: string;
  switchThumb: string;
}

function buildTokens(raw: Record<string, string>): ColorTokens {
  const background = raw.background ?? '#F9FAFB';
  const surface = raw.card ?? '#FFFFFF';
  const borderIn = raw.border ?? '#E5E7EB';
  const textIn = raw.text ?? '#111827';
  const primary = raw.primary ?? '#6366F1';
  const error = raw.error ?? raw.danger ?? '#EF4444';
  const success = raw.success ?? '#10B981';
  const warning = raw.warning ?? '#F59E0B';

  // Detect dark by background luminance. More reliable than trusting
  // a theme flag that may not exist.
  const bgLum = luminance(background);
  const isDark = bgLum !== null ? bgLum < 0.5 : false;

  // Muted text: 60% toward background. Guarantees contrast because
  // it's an interpolation of text and background, both known to be
  // legible on their own.
  const textMuted = blend(textIn, background, 0.62);

  // Border: light themes want a subtle darker line; dark themes want
  // a subtle lighter line. `borderIn` may come from the theme, but
  // if its contrast against surface is low, nudge it.
  const surfaceLum = luminance(surface);
  let border = borderIn;
  if (surfaceLum !== null) {
    const borderLum = luminance(borderIn);
    if (borderLum !== null && Math.abs(borderLum - surfaceLum) < 0.08) {
      border = isDark
        ? blend('#FFFFFF', surface, 0.14)   // lighten border on dark
        : blend('#000000', surface, 0.10);  // darken border on light
    }
  }
  const borderStrong = isDark
    ? blend('#FFFFFF', surface, 0.22)
    : blend('#000000', surface, 0.18);

  // Surface variants
  const surfaceRaised = isDark
    ? blend('#FFFFFF', surface, 0.06)
    : blend('#000000', surface, 0.02);
  const surfaceSunken = isDark
    ? blend('#000000', surface, 0.20)
    : blend('#FFFFFF', surface, 0.0);

  // Inputs need to be *just* visible against the card.
  const inputBg = isDark ? surfaceSunken : '#FFFFFF';

  // Soft primary for chips / previews (opaque).
  const primarySoft = blend(primary, surface, isDark ? 0.28 : 0.12);
  const chipSelectedText = contrastText(primary, '#FFFFFF');
  const textOnPrimary = contrastText(primary, '#FFFFFF');

  return {
    isDark,
    background,
    surface,
    surfaceRaised,
    surfaceSunken,
    border,
    borderStrong,
    text: textIn,
    textMuted,
    textOnPrimary,
    primary,
    primarySoft,
    error,
    success,
    warning,
    chipSelectedBg: primarySoft,
    chipSelectedBorder: primary,
    chipSelectedText,
    inputBg,
    previewBg: primarySoft,
    previewBorder: isDark
      ? blend(primary, surface, 0.35)
      : blend(primary, surface, 0.18),
    switchTrackOn: primary,
    switchTrackOff: isDark
      ? blend('#FFFFFF', surface, 0.20)
      : blend('#000000', surface, 0.16),
    switchThumb: isDark ? '#FFFFFF' : '#FFFFFF',
  };
}

function useTokens(): ColorTokens {
  const theme: any = useTheme();
  const base = lightTheme?.colors ?? {};
  const overrides = (theme?.theme ?? theme)?.colors ?? {};
  return useMemo(
    () => buildTokens({ ...base, ...overrides }),
    [base, overrides]
  );
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'MK';

const PRESET_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Cigarettes: 'flame-outline',
  Alcohol: 'wine-outline',
  'Junk food': 'fast-food-outline',
  Sugar: 'ice-cream-outline',
  'Social media': 'phone-portrait-outline',
  'Late nights': 'moon-outline',
  Gambling: 'dice-outline',
  'Excessive spending': 'card-outline',
  'Nail biting': 'hand-left-outline',
  Procrastination: 'time-outline',
};

const PRESET_DEFAULTS: Record<
  string,
  { reason?: string; replacement?: string; cost?: number; time?: number }
> = {
  Cigarettes: {
    reason: 'Protect my health and save money.',
    replacement: 'Chew gum, deep breaths, short walk',
    cost: 2000,
    time: 30,
  },
  Alcohol: {
    reason: 'Clearer mornings and better relationships.',
    replacement: 'Sparkling water, call a friend',
    cost: 5000,
    time: 60,
  },
  'Junk food': {
    reason: 'Feel lighter and more energetic.',
    replacement: 'Fruit, nuts, drink water',
    cost: 1500,
    time: 15,
  },
  Sugar: {
    reason: 'Steady energy, fewer crashes.',
    replacement: 'Fruit, herbal tea, walk',
    cost: 1000,
    time: 10,
  },
  'Social media': {
    reason: 'Reclaim focus and real connection.',
    replacement: 'Read, walk, call a friend',
    cost: 0,
    time: 90,
  },
  'Late nights': {
    reason: 'Wake up rested and ready.',
    replacement: 'Dim lights, read, wind down',
    cost: 0,
    time: 60,
  },
  Gambling: {
    reason: 'Protect my finances and peace of mind.',
    replacement: 'Call a friend, go for a walk',
    cost: 3000,
    time: 45,
  },
  'Excessive spending': {
    reason: 'Build savings and reduce stress.',
    replacement: 'Wait 24h, make a list, walk',
    cost: 2500,
    time: 20,
  },
  'Nail biting': {
    reason: 'Healthier nails, less anxiety.',
    replacement: 'Fidget toy, hand cream, water',
    cost: 0,
    time: 5,
  },
  Procrastination: {
    reason: 'Less stress, more progress.',
    replacement: '2-minute rule, timer, drink water',
    cost: 0,
    time: 45,
  },
};

const REPLACEMENT_SUGGESTIONS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'Drink water', icon: 'water-outline' },
  { label: 'Walk 5 min', icon: 'walk-outline' },
  { label: 'Deep breaths', icon: 'leaf-outline' },
  { label: 'Call a friend', icon: 'call-outline' },
  { label: 'Chew gum', icon: 'nutrition-outline' },
  { label: '10 push-ups', icon: 'barbell-outline' },
];

const COST_QUICK_PICKS = [500, 1000, 2000, 5000, 10000];
const TIME_QUICK_PICKS = [5, 15, 30, 60];
const DAYS_PER_MONTH = 30;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BreakPreset {
  name: string;
  icon: string;
  defaultCostPerDay?: number;
  defaultTimePerDayMinutes?: number;
  currencySymbol?: string;
}

interface BreakHabitFieldsProps {
  values: any;
  onChange: (values: any) => void;
  showPresets?: boolean;
  onApplyPreset?: (preset: BreakPreset) => void;
  currencySymbol?: string;
  disabled?: boolean;
  onFocusField?: (field: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────

function formatMoney(amount: number, symbol: string): string {
  if (!amount || amount <= 0) return `${symbol} 0`;
  const rounded = Math.round(amount * 100) / 100;
  const str = Number.isInteger(rounded)
    ? rounded.toLocaleString('en-US')
    : rounded.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `${symbol} ${str}`;
}

function formatCostChip(amount: number, symbol: string): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${symbol} ${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `${symbol} ${amount}`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function BreakHabitFields({
  values,
  onChange,
  showPresets = true,
  onApplyPreset,
  currencySymbol: currencyOverride,
  disabled = false,
  onFocusField,
}: BreakHabitFieldsProps) {
  const T = useTokens();
  const settingsSymbol = useCurrencySymbol(DEFAULT_CURRENCY);
  const currencySymbol = currencyOverride ?? settingsSymbol;

  const reasonRef = useRef<TextInput>(null);
  const costRef = useRef<TextInput>(null);
  const timeRef = useRef<TextInput>(null);

  const set = useCallback(
    (key: string, cast?: (v: any) => any) => (val: any) =>
      onChange({ ...values, [key]: cast ? cast(val) : val }),
    [values, onChange]
  );

  const reason: string = values.reason ?? '';
  const replacement: string = values.replacement_activity ?? '';
  const costNum = Number(values.cost_per_day) || 0;
  const timeNum = Number(values.time_per_day_minutes) || 0;
  const costDisplay = costNum > 0 ? String(values.cost_per_day) : '';
  const timeDisplay = timeNum > 0 ? String(values.time_per_day_minutes) : '';
  const reasonLength = reason.length;
  const reasonNearLimit = reasonLength >= MAX_REASON_LENGTH * 0.9;

  const activePreset: string | null = values.preset ?? null;

  const applyPreset = useCallback(
    (preset: BreakPreset) => {
      if (disabled) return;
      if (onApplyPreset) {
        onApplyPreset({ ...preset, currencySymbol });
        return;
      }
      const defaults = PRESET_DEFAULTS[preset.name] ?? {};
      onChange({
        ...values,
        preset: preset.name,
        name: preset.name,
        icon: preset.icon,
        reason: defaults.reason ?? values.reason ?? '',
        replacement_activity:
          defaults.replacement ?? values.replacement_activity ?? '',
        cost_per_day:
          preset.defaultCostPerDay ?? defaults.cost ?? values.cost_per_day ?? 0,
        time_per_day_minutes:
          preset.defaultTimePerDayMinutes ??
          defaults.time ??
          values.time_per_day_minutes ??
          0,
      });
    },
    [values, onChange, onApplyPreset, disabled, currencySymbol]
  );

  const clearPreset = useCallback(() => {
    if (activePreset) onChange({ ...values, preset: null });
  }, [activePreset, values, onChange]);

  const appendReplacement = useCallback(
    (text: string) => {
      if (disabled) return;
      const next = replacement
        ? `${replacement}${replacement.endsWith(',') ? ' ' : ', '}${text}`
        : text;
      onChange({
        ...values,
        replacement_activity: next.slice(0, MAX_REPLACEMENT_LENGTH),
      });
    },
    [replacement, values, onChange, disabled]
  );

  const monthlyCost = costNum * DAYS_PER_MONTH;
  const monthlyMinutes = timeNum * DAYS_PER_MONTH;
  const hasSavings = monthlyCost > 0 || monthlyMinutes > 0;

  const focusField = (field: string) => () => onFocusField?.(field);

  const SectionHeader = ({
    icon,
    title,
    helper,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    helper?: string;
  }) => (
    <View style={styles.headerRow}>
      <Ionicons name={icon} size={16} color={T.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: T.text }]}>{title}</Text>
        {helper ? (
          <Text style={[styles.helper, { color: T.textMuted }]}>{helper}</Text>
        ) : null}
      </View>
    </View>
  );

  // Input style is shared by reason, replacement, cost, time — spread
  // so any future field inherits the exact same dark-mode-safe look.
  const baseInputStyle = {
    color: T.text,
    borderColor: T.border,
    backgroundColor: T.inputBg,
    opacity: disabled ? 0.6 : 1,
  } as const;

  return (
    <View style={styles.container}>
      {/* ── Presets ─────────────────────────────────────────── */}
      {showPresets && BREAK_PRESETS.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="flash-outline"
            title="Quick start"
            helper="Pick a common habit to prefill the fields below."
          />
          <View style={styles.chipRow}>
            {BREAK_PRESETS.map((p: BreakPreset) => {
              const selected = activePreset === p.name;
              const iconName = PRESET_ICONS[p.name] ?? 'ellipse-outline';
              return (
                <Pressable
                  key={p.name}
                  onPress={() => applyPreset(p)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`Prefill for ${p.name}`}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      borderColor: selected ? T.chipSelectedBorder : T.border,
                      backgroundColor: selected
                        ? T.chipSelectedBg
                        : T.surfaceRaised,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={selected ? T.chipSelectedText : T.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.presetChipText,
                      {
                        color: selected ? T.chipSelectedText : T.text,
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Reason ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          icon="help-circle-outline"
          title="Why do you want to quit?"
          helper="Your reason is shown during weak moments. Be honest — it's for you."
        />
        <TextInput
          ref={reasonRef}
          style={[styles.input, styles.multiline, baseInputStyle]}
          placeholder="e.g. My health, my kids, my wallet"
          placeholderTextColor={T.textMuted}
          value={reason}
          onChangeText={set('reason')}
          editable={!disabled}
          multiline
          maxLength={MAX_REASON_LENGTH}
          textAlignVertical="top"
          accessibilityLabel="Reason for quitting"
          accessibilityHint="Appears on your streak screen during urges"
        />
        <Text
          style={[
            styles.counter,
            { color: reasonNearLimit ? T.error : T.textMuted },
          ]}
        >
          {reasonLength}/{MAX_REASON_LENGTH}
        </Text>
      </View>

      {/* ── Replacement ─────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          icon="swap-horizontal-outline"
          title="Do this instead"
          helper="When an urge hits, what will you do for 5 minutes?"
        />
        <TextInput
          style={[styles.input, baseInputStyle]}
          placeholder="e.g. Chew gum, walk around the block, drink water"
          placeholderTextColor={T.textMuted}
          value={replacement}
          onChangeText={set('replacement_activity')}
          onFocus={focusField('replacement_activity')}
          maxLength={MAX_REPLACEMENT_LENGTH}
          editable={!disabled}
          returnKeyType="done"
          accessibilityLabel="Replacement activity"
          accessibilityHint="What you'll do instead of the habit"
        />
        <View style={styles.chipRow}>
          {REPLACEMENT_SUGGESTIONS.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => appendReplacement(s.label)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Add ${s.label}`}
              style={({ pressed }) => [
                styles.suggestionChip,
                {
                  borderColor: T.border,
                  backgroundColor: T.surfaceRaised,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name={s.icon}
                size={14}
                color={T.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.suggestionText, { color: T.text }]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Cost & Time ─────────────────────────────────────── */}
      <View style={styles.row}>
        <View style={[styles.section, styles.half]}>
          <SectionHeader
            icon="cash-outline"
            title="Cost per day"
            helper={`Spend in ${currencySymbol}.`}
          />
          <View
            style={[
              styles.affixRow,
              {
                borderColor: T.border,
                backgroundColor: T.inputBg,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.affix, { color: T.textMuted }]}>
              {currencySymbol}
            </Text>
            <TextInput
              ref={costRef}
              style={[styles.bareInput, { color: T.text }]}
              inputMode="decimal"
              keyboardType={Platform.select({
                ios: 'decimal-pad',
                android: 'numeric',
              })}
              placeholder="0"
              placeholderTextColor={T.textMuted}
              value={costDisplay}
              onChangeText={(t) => {
                clearPreset();
                set(
                  'cost_per_day',
                  (v) => parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0
                )(t);
              }}
              onFocus={focusField('cost_per_day')}
              editable={!disabled}
              accessibilityLabel={`Cost per day in ${currencySymbol}`}
            />
          </View>
          <View style={styles.chipRow}>
            {COST_QUICK_PICKS.map((v) => {
              const selected = costNum === v;
              return (
                <Pressable
                  key={v}
                  onPress={() =>
                    onChange({
                      ...values,
                      cost_per_day: selected ? 0 : v,
                    })
                  }
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`Set cost to ${formatMoney(
                    v,
                    currencySymbol
                  )} per day`}
                  style={[
                    styles.miniChip,
                    {
                      borderColor: selected ? T.primary : T.border,
                      backgroundColor: selected
                        ? T.chipSelectedBg
                        : T.surfaceRaised,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      {
                        color: selected
                          ? T.chipSelectedText
                          : T.textMuted,
                        fontWeight: selected ? '700' : '400',
                      },
                    ]}
                  >
                    {formatCostChip(v, currencySymbol)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, styles.half]}>
          <SectionHeader
            icon="time-outline"
            title="Time per day"
            helper="Minutes reclaimed."
          />
          <View
            style={[
              styles.affixRow,
              {
                borderColor: T.border,
                backgroundColor: T.inputBg,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
          >
            <TextInput
              ref={timeRef}
              style={[styles.bareInput, { color: T.text }]}
              inputMode="numeric"
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={T.textMuted}
              value={timeDisplay}
              onChangeText={(t) => {
                clearPreset();
                set(
                  'time_per_day_minutes',
                  (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0
                )(t);
              }}
              onFocus={focusField('time_per_day_minutes')}
              editable={!disabled}
              accessibilityLabel="Minutes per day"
            />
            <Text style={[styles.affix, { color: T.textMuted }]}>min</Text>
          </View>
          <View style={styles.chipRow}>
            {TIME_QUICK_PICKS.map((v) => {
              const selected = timeNum === v;
              return (
                <Pressable
                  key={v}
                  onPress={() =>
                    onChange({
                      ...values,
                      time_per_day_minutes: selected ? 0 : v,
                    })
                  }
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`Set time to ${v} minutes per day`}
                  style={[
                    styles.miniChip,
                    {
                      borderColor: selected ? T.primary : T.border,
                      backgroundColor: selected
                        ? T.chipSelectedBg
                        : T.surfaceRaised,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      {
                        color: selected ? T.chipSelectedText : T.textMuted,
                        fontWeight: selected ? '700' : '400',
                      },
                    ]}
                  >
                    {v}m
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Savings preview ─────────────────────────────────── */}
      {hasSavings && (
        <View
          style={[
            styles.previewCard,
            { borderColor: T.previewBorder, backgroundColor: T.previewBg },
          ]}
          accessibilityRole="summary"
          accessibilityLabel={`Monthly upside: ${
            monthlyCost > 0
              ? `saving ${formatMoney(monthlyCost, currencySymbol)}`
              : ''
          } ${
            monthlyMinutes > 0
              ? `and reclaiming ${formatDuration(monthlyMinutes)}`
              : ''
          }`.trim()}
        >
          <View style={styles.previewHeaderRow}>
            <Ionicons name="trending-up-outline" size={16} color={T.primary} />
            <Text style={[styles.previewTitle, { color: T.text }]}>
              Your monthly upside
            </Text>
          </View>
          <View style={styles.previewRow}>
            {monthlyCost > 0 && (
              <View style={styles.previewStat}>
                <Ionicons name="cash" size={18} color={T.primary} />
                <Text style={[styles.previewValue, { color: T.text }]}>
                  {formatMoney(monthlyCost, currencySymbol)}
                </Text>
                <Text style={[styles.previewLabel, { color: T.textMuted }]}>
                  saved
                </Text>
              </View>
            )}
            {monthlyMinutes > 0 && (
              <View style={styles.previewStat}>
                <Ionicons name="hourglass" size={18} color={T.primary} />
                <Text style={[styles.previewValue, { color: T.text }]}>
                  {formatDuration(monthlyMinutes)}
                </Text>
                <Text style={[styles.previewLabel, { color: T.textMuted }]}>
                  reclaimed
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Track urges switch ──────────────────────────────── */}
      <View
        style={[
          styles.switchRow,
          { borderColor: T.border, backgroundColor: T.surfaceRaised },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={18}
          color={T.primary}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.label, { color: T.text, marginTop: 0 }]}>
            Track urges &amp; relapses
          </Text>
          <Text
            style={[styles.helper, { color: T.textMuted, marginBottom: 0 }]}
          >
            Log intense moments to spot triggers and build awareness.
          </Text>
        </View>
        <Switch
          value={!!values.track_urges}
          onValueChange={(v) => onChange({ ...values, track_urges: v })}
          disabled={disabled}
          trackColor={{
            false: T.switchTrackOff,
            true: T.switchTrackOn,
          }}
          thumbColor={T.switchThumb}
          ios_backgroundColor={T.switchTrackOff}
          accessibilityLabel="Track urges and relapses"
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles — only geometry; colors come from tokens at render time
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: 18, marginTop: 8 },
  section: { gap: 6 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, marginTop: 4, marginBottom: 4 },
  helper: { fontSize: 12, marginTop: 2, marginBottom: 2 },
  counter: { fontSize: 11, alignSelf: 'flex-end' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
  },
  multiline: { minHeight: 80, paddingTop: 10 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  affixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  affix: { fontSize: 14, fontWeight: '600' },
  bareInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 13 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 12 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  miniChipText: { fontSize: 12 },
  previewCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  previewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewTitle: { fontSize: 13, fontWeight: '600' },
  previewRow: { flexDirection: 'row', gap: 24 },
  previewStat: { alignItems: 'flex-start', gap: 2 },
  previewValue: { fontSize: 20, fontWeight: '700' },
  previewLabel: { fontSize: 11 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
});