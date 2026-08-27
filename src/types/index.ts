// Category type
export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at?: string;
}

// Habit type
export interface Habit {
  id: number;
  name: string;
  description?: string;
  category_id?: number | null;
  icon?: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  selected_days?: string;
  reminder_time?: string;
  target_count: number;
  start_date: string;
  archived: number;
  created_at?: string;
  updated_at?: string;
}

// Habit log type
export interface HabitLog {
  id: number;
  habit_id: number;
  log_date: string;
  status: 'completed' | 'missed' | 'skipped';
  completed_at?: string;
  excuse_id?: number | null;
  notes?: string;
  created_at?: string;
}

// Excuse type
export interface Excuse {
  id: number;
  text: string;
  reality_check?: string;
  action_next_time?: string;
  category: string;
  created_at?: string;
}

// Routine type
export interface Routine {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  start_time?: string;
  days?: string;
  archived: number;
  created_at?: string;
  updated_at?: string;
}

// Routine task type
export interface RoutineTask {
  id: number;
  routine_id: number;
  habit_id?: number | null;
  task_name: string;
  order_index: number;
  duration_minutes: number;
  created_at?: string;
}

// Routine log type
export interface RoutineLog {
  id: number;
  routine_task_id: number;
  log_date: string;
  status: 'completed' | 'missed' | 'skipped';
  completed_at?: string;
  created_at?: string;
}

// Achievement type
export interface Achievement {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  xp_reward: number;
  criteria?: string;
  created_at?: string;
}

// User achievement type
export interface UserAchievement {
  id: number;
  achievement_id: number;
  unlocked_at: string;
}

// Notification type
export interface Notification {
  id: number;
  type: string;
  title?: string;
  body?: string;
  scheduled_time?: string;
  enabled: number;
  created_at?: string;
}

// Quote type
export interface Quote {
  id: number;
  text: string;
  author?: string;
  category?: string;
}

// Settings type
export interface Setting {
  id: number;
  key: string;
  value?: string;
  updated_at?: string;
}

export interface OnboardingPreferences {
  goals: string[];
  wakeUpTime?: string;
  sleepTime?: string;
  notificationsEnabled: boolean;
  selectedCategories: string[];
  selectedHabits: string[];
}
