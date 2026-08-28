import { create } from 'zustand';
import { excuseService } from '../services/excuseService';
import { Excuse } from '../types';

interface ExcuseState {
  excuses: Excuse[];
  predefinedExcuses: Excuse[];
  customExcuses: Excuse[];
  mostCommonExcuses: (Excuse & { count: number })[];
  isLoading: boolean;
  error: string | null;
  
  fetchExcuses: () => Promise<void>;
  fetchPredefined: () => Promise<void>;
  fetchCustom: () => Promise<void>;
  fetchMostCommon: (limit?: number) => Promise<void>;
  createExcuse: (excuse: Omit<Excuse, 'id' | 'created_at'>) => Promise<number>;
  updateExcuse: (id: number, excuse: Partial<Excuse>) => Promise<void>;
  deleteExcuse: (id: number) => Promise<void>;
  getExcuseById: (id: number) => Excuse | undefined;
}

export const useExcuseStore = create<ExcuseState>((set, get) => ({
  excuses: [],
  predefinedExcuses: [],
  customExcuses: [],
  mostCommonExcuses: [],
  isLoading: false,
  error: null,

  fetchExcuses: async () => {
    set({ isLoading: true, error: null });
    try {
      const excuses = await excuseService.fetchAll();
      set({ excuses, isLoading: false });
    } catch (error) {
      console.error('Error fetching excuses:', error);
      set({ error: 'Failed to load excuses', isLoading: false });
    }
  },

  fetchPredefined: async () => {
    try {
      const predefinedExcuses = await excuseService.fetchPredefined();
      set({ predefinedExcuses });
    } catch (error) {
      console.error('Error fetching predefined excuses:', error);
      set({ error: 'Failed to load predefined excuses' });
    }
  },

  fetchCustom: async () => {
    try {
      const customExcuses = await excuseService.fetchCustom();
      set({ customExcuses });
    } catch (error) {
      console.error('Error fetching custom excuses:', error);
      set({ error: 'Failed to load custom excuses' });
    }
  },

  fetchMostCommon: async (limit = 5) => {
    try {
      const mostCommonExcuses = await excuseService.getMostCommon(limit);
      set({ mostCommonExcuses });
    } catch (error) {
      console.error('Error fetching most common excuses:', error);
      set({ error: 'Failed to load excuse analytics' });
    }
  },

  createExcuse: async (excuse) => {
    set({ isLoading: true, error: null });
    try {
      const id = await excuseService.create(excuse);
      await Promise.all([
        get().fetchExcuses(),
        get().fetchCustom(),
      ]);
      set({ isLoading: false });
      return id;
    } catch (error) {
      console.error('Error creating excuse:', error);
      set({ error: 'Failed to create excuse', isLoading: false });
      throw error;
    }
  },

  updateExcuse: async (id, excuse) => {
    set({ isLoading: true, error: null });
    try {
      await excuseService.update(id, excuse);
      await get().fetchExcuses();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating excuse:', error);
      set({ error: 'Failed to update excuse', isLoading: false });
      throw error;
    }
  },

  deleteExcuse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await excuseService.delete(id);
      await get().fetchExcuses();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error deleting excuse:', error);
      set({ error: 'Failed to delete excuse', isLoading: false });
      throw error;
    }
  },

  getExcuseById: (id) => {
    return get().excuses.find(e => e.id === id);
  },
}));