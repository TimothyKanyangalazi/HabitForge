// src/stores/settingsStore.ts
import { create } from 'zustand';
import { settingsService } from '../services/settingsService';

interface SettingsState {
  settings: {
    theme: string;
    notificationsEnabled: boolean;
    dailyReminderTime: string;
    weeklyReviewDay: string;
    onboardingCompleted: boolean;
    userXp: number;
    userLevel: number;
  };
  isLoading: boolean;
  
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SettingsState['settings']>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    theme: 'light',
    notificationsEnabled: true,
    dailyReminderTime: '08:00',
    weeklyReviewDay: 'Sunday',
    onboardingCompleted: false,
    userXp: 0,
    userLevel: 1,
  },
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const loadedSettings = await settingsService.getMultiple([
        'theme',
        'notifications_enabled',
        'daily_reminder_time',
        'weekly_review_day',
        'onboarding_completed',
        'user_xp',
        'user_level',
      ]);

      set({
        settings: {
          theme: loadedSettings.theme || 'light',
          notificationsEnabled: loadedSettings.notifications_enabled !== 'false',
          dailyReminderTime: loadedSettings.daily_reminder_time || '08:00',
          weeklyReviewDay: loadedSettings.weekly_review_day || 'Sunday',
          onboardingCompleted: loadedSettings.onboarding_completed === 'true',
          userXp: parseInt(loadedSettings.user_xp || '0'),
          userLevel: parseInt(loadedSettings.user_level || '1'),
        },
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    try {
      const settingsToSave: Record<string, string> = {};
      
      if (updates.theme !== undefined) {
        settingsToSave.theme = updates.theme;
      }
      if (updates.notificationsEnabled !== undefined) {
        settingsToSave.notifications_enabled = String(updates.notificationsEnabled);
      }
      if (updates.dailyReminderTime !== undefined) {
        settingsToSave.daily_reminder_time = updates.dailyReminderTime;
      }
      if (updates.weeklyReviewDay !== undefined) {
        settingsToSave.weekly_review_day = updates.weeklyReviewDay;
      }
      
      await settingsService.setMultiple(settingsToSave);
      
      set((state) => ({
        settings: {
          ...state.settings,
          ...updates,
        },
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  },

  completeOnboarding: async () => {
    try {
      await settingsService.completeOnboarding();
      set((state) => ({
        settings: {
          ...state.settings,
          onboardingCompleted: true,
        },
      }));
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  },
}));