// src/constants/breakHabit.ts
import type { UrgeOutcome } from '../../types';

// ── Urge tracking
export const URGE_INTENSITY_MIN = 1;
export const URGE_INTENSITY_MAX = 10;

export const URGE_TRIGGERS: string[] = [
  'Stress',
  'Boredom',
  'Loneliness',
  'Social pressure',
  'Habit loop / routine',
  'Emotional low',
  'Celebration',
  'Late night',
  'After a meal',
  'Fatigue',
];

export const URGE_OUTCOMES: {
  value: UrgeOutcome;
  label: string;
  color: string;
}[] = [
  { value: 'resisted', label: 'Resisted', color: '#22C55E' },
  { value: 'delayed',  label: 'Delayed',  color: '#F59E0B' },
  { value: 'gave_in',  label: 'Gave in',  color: '#EF4444' },
];

// ── Recovery / tips copy ────────────────────────────────────────────────
export const DEFAULT_RECOVERY_PLAN = `1. Identify the trigger.
2. Use my replacement activity for 10 minutes.
3. Log the urge and how I felt.
4. Recommit — one slip is not a failure.`;

export const BREAK_HABIT_TIPS: string[] = [
  'Urges typically peak within 5–10 minutes — ride the wave.',
  'Replace, don’t just remove. Give the trigger somewhere to go.',
  'Log every urge. Awareness shrinks the loop.',
  'A relapse is data, not defeat.',
];

// ── Habit-type picker ───────────────────────────────────────────────────
export interface HabitTypeOption {
  value: 'build' | 'break';
  label: string;
  description: string;
  icon: string;
  /** Optional third line shown under the description. */
  example?: string;
}

export const HABIT_TYPE_OPTIONS: HabitTypeOption[] = [
  {
    value: 'build',
    label: 'Build a habit',
    description: 'Something you want to start doing regularly.',
    icon: 'add-circle-outline',
    example: 'Exercise, read, meditate',
  },
  {
    value: 'break',
    label: 'Break a habit',
    description: 'Something you want to stop doing.',
    icon: 'remove-circle-outline',
    example: 'Smoking, doom-scrolling',
  },
];

// ── Break-habit form field limits ───────────────────────────────────────
export const MAX_REASON_LENGTH = 500;
export const MAX_REPLACEMENT_LENGTH = 200;

// ── Break-habit presets (Quick start chips) ─────────────────────────────
export interface BreakPreset {
  /** Shown as the chip label and used as the default habit name. */
  name: string;
  /** Ionicons name — must exist in @expo/vector-icons. */
  icon: string;
  /** Pre-fills the "Cost per day" field (in currency units). */
  defaultCostPerDay?: number;
  /** Pre-fills the "Time per day" field (in minutes). */
  defaultTimePerDayMinutes?: number;
}
export const REPLACEMENT_SUGGESTIONS = [
  'Drink water',
  'Walk 5 min',
  'Deep breaths',
  'Call a friend',
  'Chew gum',
  '10 push-ups',
];

export const COST_QUICK_PICKS = [1, 3, 5, 10, 20];   // per-day
export const TIME_QUICK_PICKS = [5, 15, 30, 60];

export const BREAK_PRESETS: BreakPreset[] = [
  {
    name: 'Smoking',
    icon: 'flame-outline',
    defaultCostPerDay: 8,
    defaultTimePerDayMinutes: 30,
  },
  {
    name: 'Vaping',
    icon: 'cloud-outline',
    defaultCostPerDay: 5,
    defaultTimePerDayMinutes: 20,
  },
  {
    name: 'Alcohol',
    icon: 'wine-outline',
    defaultCostPerDay: 10,
    defaultTimePerDayMinutes: 60,
  },
  {
    name: 'Doom-scrolling',
    icon: 'phone-portrait-outline',
    defaultCostPerDay: 0,
    defaultTimePerDayMinutes: 90,
  },
  {
    name: 'Junk food',
    icon: 'fast-food-outline',
    defaultCostPerDay: 6,
    defaultTimePerDayMinutes: 15,
  },
  {
    name: 'Caffeine (late)',
    icon: 'cafe-outline',
    defaultCostPerDay: 4,
    defaultTimePerDayMinutes: 15,
  },
];