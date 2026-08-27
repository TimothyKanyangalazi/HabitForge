import { create } from 'zustand';

interface HabitStore {
  habits: any[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  //Add other actions later
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  isLoading: false,
  fetchHabits: async () => {
    set({ isLoading: true });
    // Call habitService.fetchAll() later
    set({ habits: [], isLoading: false });
  },
}));