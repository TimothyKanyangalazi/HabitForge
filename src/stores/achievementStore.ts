import { create } from 'zustand';
import { achievementService } from '../services/achievementService';
import { Achievement } from '../types';

interface AchievementState {
  achievements: Achievement[];
  userAchievements: (Achievement & { unlocked_at: string })[];
  unlockedIds: Set<number>;
  totalXp: number;
  userLevel: number;
  isLoading: boolean;
  error: string | null;
  
  fetchAchievements: () => Promise<void>;
  fetchUserAchievements: () => Promise<void>;
  checkAndUnlock: () => Promise<Achievement[]>;
  getUserProgress: () => Promise<void>;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  userAchievements: [],
  unlockedIds: new Set(),
  totalXp: 0,
  userLevel: 1,
  isLoading: false,
  error: null,

  fetchAchievements: async () => {
    set({ isLoading: true, error: null });
    try {
      const achievements = await achievementService.fetchAll();
      const userAchievements = await achievementService.fetchUserAchievements();
      const unlockedIds = new Set(userAchievements.map(a => a.id));
      
      const totalXp = userAchievements.reduce((sum, a) => sum + (a.xp_reward || 0), 0);
      const userLevel = Math.floor(totalXp / 100) + 1;
      
      set({ 
        achievements, 
        userAchievements, 
        unlockedIds,
        totalXp,
        userLevel,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      set({ error: 'Failed to load achievements', isLoading: false });
    }
  },

  fetchUserAchievements: async () => {
    try {
      const userAchievements = await achievementService.fetchUserAchievements();
      const unlockedIds = new Set(userAchievements.map(a => a.id));
      const totalXp = userAchievements.reduce((sum, a) => sum + (a.xp_reward || 0), 0);
      const userLevel = Math.floor(totalXp / 100) + 1;
      
      set({ userAchievements, unlockedIds, totalXp, userLevel });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  },

  checkAndUnlock: async () => {
    try {
      const newlyUnlocked = await achievementService.checkAndUnlockAchievements();
      if (newlyUnlocked.length > 0) {
        await get().fetchAchievements();
      }
      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  getUserProgress: async () => {
    try {
      const progress = await achievementService.getUserProgress();
      set({ totalXp: progress.xp, userLevel: progress.level });
    } catch (error) {
      console.error('Error getting user progress:', error);
    }
  },
}));