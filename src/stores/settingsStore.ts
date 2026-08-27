import { create } from 'zustand';
import { settingsService } from '../services/settingsService';

interface SettingsState {
  theme: string;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  weeklyReviewDay: string;
  onboardingCompleted: boolean;
  userXp: number;
  userLevel: number;
  isLoading: boolean;
  
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  notificationsEnabled: true,
  dailyReminderTime: '08:00',
  weeklyReviewDay: 'Sunday',
  onboardingCompleted: false,
  userXp: 0,
  userLevel: 1,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await settingsService.getMultiple([
        'theme',
        'notifications_enabled',
        'daily_reminder_time',
        'weekly_review_day',
        'onboarding_completed',
        'user_xp',
        'user_level',
      ]);

      set({
        theme: settings.theme || 'light',
        notificationsEnabled: settings.notifications_enabled !== 'false',
        dailyReminderTime: settings.daily_reminder_time || '08:00',
        weeklyReviewDay: settings.weekly_review_day || 'Sunday',
        onboardingCompleted: settings.onboarding_completed === 'true',
        userXp: parseInt(settings.user_xp || '0'),
        userLevel: parseInt(settings.user_level || '1'),
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
        set({ theme: updates.theme });
      }
      if (updates.notificationsEnabled !== undefined) {
        settingsToSave.notifications_enabled = String(updates.notificationsEnabled);
        set({ notificationsEnabled: updates.notificationsEnabled });
      }
      if (updates.dailyReminderTime !== undefined) {
        settingsToSave.daily_reminder_time = updates.dailyReminderTime;
        set({ dailyReminderTime: updates.dailyReminderTime });
      }
      if (updates.weeklyReviewDay !== undefined) {
        settingsToSave.weekly_review_day = updates.weeklyReviewDay;
        set({ weeklyReviewDay: updates.weeklyReviewDay });
      }
      
      await settingsService.setMultiple(settingsToSave);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  },

  completeOnboarding: async () => {
    try {
      await settingsService.completeOnboarding();
      set({ onboardingCompleted: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  },
}));