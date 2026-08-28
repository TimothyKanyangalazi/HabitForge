import { create } from 'zustand';
import { habitService } from '../services/habitService';
import { Habit, HabitLog } from '../types';

interface HabitState {
  habits: Habit[];
  todayLogs: Record<number, HabitLog>;
  isLoading: boolean;
  error: string | null;
  
  fetchHabits: () => Promise<void>;
  fetchTodayLogs: (date: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateHabit: (id: number, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;
  unarchiveHabit: (id: number) => Promise<void>;
  logHabit: (log: Omit<HabitLog, 'id' | 'created_at'>) => Promise<void>;
  getHabitById: (id: number) => Habit | undefined;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayLogs: {},
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const habits = await habitService.fetchAll();
      set({ habits, isLoading: false });
    } catch (error) {
      console.error('Error fetching habits:', error);
      set({ error: 'Failed to load habits', isLoading: false });
    }
  },

  fetchTodayLogs: async (date: string) => {
    try {
      const logs = await habitService.getLogsByDate(date);
      const logMap: Record<number, HabitLog> = {};
      logs.forEach(log => {
        logMap[log.habit_id] = log;
      });
      set({ todayLogs: logMap });
    } catch (error) {
      console.error('Error fetching today logs:', error);
    }
  },

  createHabit: async (habit) => {
    set({ isLoading: true, error: null });
    try {
      const id = await habitService.create(habit);
      await get().fetchHabits();
      return id;
    } catch (error) {
      console.error('Error creating habit:', error);
      set({ error: 'Failed to create habit', isLoading: false });
      throw error;
    }
  },

  updateHabit: async (id, habit) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.update(id, habit);
      await get().fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      set({ error: 'Failed to update habit', isLoading: false });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await habitService.delete(id);
      await get().fetchHabits();
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
    } catch (error) {
      console.error('Error archiving habit:', error);
      set({ error: 'Failed to archive habit' });
    }
  },

  unarchiveHabit: async (id) => {
    try {
      await habitService.unarchive(id);
      await get().fetchHabits();
    } catch (error) {
      console.error('Error unarchiving habit:', error);
      set({ error: 'Failed to unarchive habit' });
    }
  },

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

  getHabitById: (id) => {
    return get().habits.find(h => h.id === id);
  },
}));