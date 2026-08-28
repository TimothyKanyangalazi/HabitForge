import { create } from 'zustand';
import { routineService } from '../services/routineService';
import { Routine, RoutineTask, RoutineLog } from '../types';

interface RoutineState {
  routines: Routine[];
  currentRoutine: (Routine & { tasks: RoutineTask[] }) | null;
  todayLogs: Record<number, RoutineLog>;
  isLoading: boolean;
  error: string | null;
  
  fetchRoutines: () => Promise<void>;
  fetchRoutineById: (id: number) => Promise<void>;
  fetchTodayLogs: (date: string) => Promise<void>;
  createRoutine: (routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateRoutine: (id: number, routine: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: number) => Promise<void>;
  archiveRoutine: (id: number) => Promise<void>;
  unarchiveRoutine: (id: number) => Promise<void>;
  addTask: (task: Omit<RoutineTask, 'id' | 'created_at'>) => Promise<number>;
  updateTask: (id: number, task: Partial<RoutineTask>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  reorderTasks: (routineId: number, taskIds: number[]) => Promise<void>;
  logTask: (log: Omit<RoutineLog, 'id' | 'created_at'>) => Promise<void>;
  clearCurrentRoutine: () => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  currentRoutine: null,
  todayLogs: {},
  isLoading: false,
  error: null,

  fetchRoutines: async () => {
    set({ isLoading: true, error: null });
    try {
      const routines = await routineService.fetchAll();
      set({ routines, isLoading: false });
    } catch (error) {
      console.error('Error fetching routines:', error);
      set({ error: 'Failed to load routines', isLoading: false });
    }
  },

  fetchRoutineById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const routine = await routineService.fetchById(id);
      set({ currentRoutine: routine, isLoading: false });
    } catch (error) {
      console.error('Error fetching routine:', error);
      set({ error: 'Failed to load routine', isLoading: false });
    }
  },

  fetchTodayLogs: async (date: string) => {
    try {
      const logs = await routineService.getLogsByDate(date);
      const logMap: Record<number, RoutineLog> = {};
      logs.forEach(log => {
        logMap[log.routine_task_id] = log;
      });
      set({ todayLogs: logMap });
    } catch (error) {
      console.error('Error fetching today logs:', error);
    }
  },

  createRoutine: async (routine) => {
    set({ isLoading: true, error: null });
    try {
      const id = await routineService.create(routine);
      await get().fetchRoutines();
      set({ isLoading: false });
      return id;
    } catch (error) {
      console.error('Error creating routine:', error);
      set({ error: 'Failed to create routine', isLoading: false });
      throw error;
    }
  },

  updateRoutine: async (id, routine) => {
    set({ isLoading: true, error: null });
    try {
      await routineService.update(id, routine);
      await get().fetchRoutines();
      if (get().currentRoutine?.id === id) {
        await get().fetchRoutineById(id);
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating routine:', error);
      set({ error: 'Failed to update routine', isLoading: false });
      throw error;
    }
  },

  deleteRoutine: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await routineService.delete(id);
      await get().fetchRoutines();
      if (get().currentRoutine?.id === id) {
        set({ currentRoutine: null });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error deleting routine:', error);
      set({ error: 'Failed to delete routine', isLoading: false });
      throw error;
    }
  },

  archiveRoutine: async (id) => {
    try {
      await routineService.archive(id);
      await get().fetchRoutines();
    } catch (error) {
      console.error('Error archiving routine:', error);
      set({ error: 'Failed to archive routine' });
      throw error;
    }
  },

  unarchiveRoutine: async (id) => {
    try {
      await routineService.unarchive(id);
      await get().fetchRoutines();
    } catch (error) {
      console.error('Error unarchiving routine:', error);
      set({ error: 'Failed to unarchive routine' });
      throw error;
    }
  },

  addTask: async (task) => {
    try {
      const id = await routineService.addTask(task);
      if (get().currentRoutine?.id === task.routine_id) {
        await get().fetchRoutineById(task.routine_id);
      }
      return id;
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: 'Failed to add task' });
      throw error;
    }
  },

  updateTask: async (id, task) => {
    try {
      await routineService.updateTask(id, task);
      const currentRoutine = get().currentRoutine;
      if (currentRoutine) {
        await get().fetchRoutineById(currentRoutine.id);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: 'Failed to update task' });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await routineService.deleteTask(id);
      const currentRoutine = get().currentRoutine;
      if (currentRoutine) {
        await get().fetchRoutineById(currentRoutine.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: 'Failed to delete task' });
      throw error;
    }
  },

  reorderTasks: async (routineId: number, taskIds: number[]) => {
    try {
      await routineService.reorderTasks(routineId, taskIds);
      await get().fetchRoutineById(routineId);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      set({ error: 'Failed to reorder tasks' });
      throw error;
    }
  },

  logTask: async (log) => {
    try {
      await routineService.logTask(log);
      const today = new Date().toISOString().split('T')[0];
      await get().fetchTodayLogs(today);
    } catch (error) {
      console.error('Error logging task:', error);
      set({ error: 'Failed to log task' });
      throw error;
    }
  },

  clearCurrentRoutine: () => {
    set({ currentRoutine: null });
  },
}));