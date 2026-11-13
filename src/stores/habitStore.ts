import { create } from 'zustand';
import { habitService } from '../services/habitService';
import { urgeService } from '../services/urgeService';
import { relapseService } from '../services/relapseService';
import type {
  Habit,
  HabitInput,
  HabitLog,
  Urge,
  UrgeInput,
  Relapse,
  RelapseInput,
  BreakHabitStats,
} from '../types';

interface HabitState {
  // ── state ─────────────────────────────────────────────────────────────
  habits: Habit[];
  breakHabits: Habit[];
  todayLogs: Record<number, HabitLog>;
  urges: Urge[];
  relapses: Relapse[];
  stats: Record<number, BreakHabitStats>;
  isLoading: boolean;
  error: string | null;

  // ── habit actions ─────────────────────────────────────────────────────
  fetchHabits: () => Promise<void>;
  loadBreakHabits: () => Promise<void>;
  fetchTodayLogs: (date: string) => Promise<void>;
  createHabit: (input: HabitInput) => Promise<number>;
  updateHabit: (id: number, input: Partial<HabitInput>) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;
  unarchiveHabit: (id: number) => Promise<void>;
  getHabitById: (id: number) => Habit | undefined;

  // ── habit log actions ─────────────────────────────────────────────────
  logHabit: (log: Omit<HabitLog, 'id' | 'created_at'>) => Promise<void>;

  // ── break-habit (urge / relapse) actions ──────────────────────────────
  logUrge: (input: UrgeInput) => Promise<void>;
  loadUrges: (habitId: number) => Promise<void>;
  logRelapse: (input: RelapseInput) => Promise<void>;
  loadRelapses: (habitId: number) => Promise<void>;
  refreshStats: (habitId: number) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  // ── initial state ─────────────────────────────────────────────────────
  habits: [],
  breakHabits: [],
  todayLogs: {},
  urges: [],
  relapses: [],
  stats: {},
  isLoading: false,
  error: null,

  // ── habit actions ─────────────────────────────────────────────────────
  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitService.list();
      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error fetching habits:', error);
      set({ error: 'Failed to load habits', isLoading: false });
    }
  },

  loadBreakHabits: async () => {
    try {
      const breakHabits = await habitService.listByType('break');
      set({ breakHabits });
    } catch (error) {
      console.error('Error fetching break habits:', error);
      set({ error: 'Failed to load break habits' });
    }
  },

  fetchTodayLogs: async (date: string) => {
    try {
      const logs = await habitService.getLogsByDate(date);
      const logMap: Record<number, HabitLog> = {};
      logs.forEach((log) => {
        logMap[log.habit_id] = log;
      });
      set({ todayLogs: logMap });
    } catch (error) {
      console.error('Error fetching today logs:', error);
    }
  },

  createHabit: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const id = await habitService.create(input);
      await get().fetchHabits();
      if (input.habit_type === 'break') {
        await get().loadBreakHabits();
      }
      return id;
    } catch (error) {
      console.error('Error creating habit:', error);
      set({ error: 'Failed to create habit', isLoading: false });
      throw error;
    }
  },

  updateHabit: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.update(id, input);
      await get().fetchHabits();
      await get().loadBreakHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      set({ error: 'Failed to update habit', isLoading: false });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.remove(id);
      await get().fetchHabits();
      await get().loadBreakHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      set({ error: 'Failed to delete habit', isLoading: false });
      throw error;
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitService.archive(id);
      await get().fetchHabits();
      await get().loadBreakHabits();
    } catch (error) {
      console.error('Error archiving habit:', error);
      set({ error: 'Failed to archive habit' });
    }
  },

  unarchiveHabit: async (id) => {
    try {
      await habitService.unarchive(id);
      await get().fetchHabits();
      await get().loadBreakHabits();
    } catch (error) {
      console.error('Error unarchiving habit:', error);
      set({ error: 'Failed to unarchive habit' });
    }
  },

  getHabitById: (id) => get().habits.find((h) => h.id === id),

  // ── habit log actions ─────────────────────────────────────────────────
  logHabit: async (log) => {
    try {
      await habitService.logHabit(log);
      const today = new Date().toISOString().split('T')[0];
      await get().fetchTodayLogs(today);
    } catch (error) {
      console.error('Error logging habit:', error);
      set({ error: 'Failed to log habit' });
      throw error;
    }
  },

  // ── break-habit (urge / relapse) actions ──────────────────────────────
  logUrge: async (input) => {
    try {
      await urgeService.create(input);
      await get().loadUrges(input.habit_id);
      await get().refreshStats(input.habit_id);
    } catch (error) {
      console.error('Error logging urge:', error);
      set({ error: 'Failed to log urge' });
      throw error;
    }
  },

  loadUrges: async (habitId) => {
    try {
      const urges = await urgeService.listForHabit(habitId);
      set({ urges });
    } catch (error) {
      console.error('Error loading urges:', error);
    }
  },

  logRelapse: async (input) => {
    try {
      await relapseService.create(input);
      await get().loadRelapses(input.habit_id);
      await get().refreshStats(input.habit_id);
    } catch (error) {
      console.error('Error logging relapse:', error);
      set({ error: 'Failed to log relapse' });
      throw error;
    }
  },

  loadRelapses: async (habitId) => {
    try {
      const relapses = await relapseService.listForHabit(habitId);
      set({ relapses });
    } catch (error) {
      console.error('Error loading relapses:', error);
    }
  },

  refreshStats: async (habitId) => {
    try {
      const stats = await urgeService.getStats(habitId);
      set((s) => ({ stats: { ...s.stats, [habitId]: stats } }));
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  },
}));