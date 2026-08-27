import { create } from 'zustand';

interface RoutineStore {
  routines: any[];
  isLoading: boolean;
  fetchRoutines: () => Promise<void>;
}

export const useRoutineStore = create<RoutineStore>((set) => ({
  routines: [],
  isLoading: false,
  fetchRoutines: async () => {
    set({ isLoading: true });
    // Later: routineService.fetchAll()
    set({ routines: [], isLoading: false });
  },
}));