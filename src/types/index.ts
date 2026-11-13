
export type HabitType = 'build' | 'break';

export interface Habit {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  frequency_type: string;
  target_count: number;
  created_at: string;
  archived?: number;              // 0 | 1

  // ---- Break-habit extension (Migration 002) ----
  habit_type: HabitType;
  reason?: string | null;
  replacement_activity?: string | null;
  cost_per_day?: number;
  time_per_day_minutes?: number;
}

export interface HabitInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency?: string;
  target_count?: number;
  habit_type?: HabitType;
  reason?: string;
  replacement_activity?: string;
  cost_per_day?: number;
  time_per_day_minutes?: number;
}

// ============================================================
// Urges
// ============================================================
export type UrgeOutcome = 'resisted' | 'gave_in' | 'delayed';

export interface Urge {
  id: number;
  habit_id: number;
  logged_at: string;
  intensity: number;              // 1..10
  trigger?: string | null;
  outcome: UrgeOutcome;
  notes?: string | null;
  created_at?: string;
}

export interface UrgeInput {
  habit_id: number;
  logged_at?: string;
  intensity: number;
  trigger?: string;
  outcome: UrgeOutcome;
  notes?: string;
}

// ============================================================
// Relapses
// ============================================================
export interface Relapse {
  id: number;
  habit_id: number;
  relapse_date: string;
  trigger?: string | null;
  notes?: string | null;
  recovery_plan?: string | null;
  created_at?: string;
}

export interface RelapseInput {
  habit_id: number;
  relapse_date?: string;
  trigger?: string;
  notes?: string;
  recovery_plan?: string;
}

// ============================================================
// Aggregates used by the UI
// ============================================================
export interface BreakHabitStats {
  habit_id: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_urges: number;
  resisted_urges: number;
  relapses_count: number;
  money_saved: number;
  time_reclaimed_minutes: number;
  last_relapse_date?: string | null;
}