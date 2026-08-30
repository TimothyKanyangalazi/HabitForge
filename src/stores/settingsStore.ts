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
  isSaving: boolean;
  error: string | null;
  hasLoaded: boolean;
  
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SettingsState['settings']>) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  resetSettings: () => Promise<void>;
  getSetting: <K extends keyof SettingsState['settings']>(key: K) => SettingsState['settings'][K];
  isOnboardingCompleted: () => boolean;
}

const defaultSettings = {
  theme: 'light',
  notificationsEnabled: true,
  dailyReminderTime: '08:00',
  weeklyReviewDay: 'Sunday',
  onboardingCompleted: false,
  userXp: 0,
  userLevel: 1,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...defaultSettings },
  isLoading: false,
  isSaving: false,
  error: null,
  hasLoaded: false,

  loadSettings: async () => {
    // Don't reload if already loaded
    if (get().hasLoaded) {
      console.log('ℹ️ Settings already loaded, skipping');
      return;
    }

    set({ isLoading: true, error: null });
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

      console.log('📂 Loaded settings from database:', loadedSettings);

      // Parse with safe fallbacks
      const parsedSettings = {
        theme: loadedSettings.theme || defaultSettings.theme,
        notificationsEnabled: loadedSettings.notifications_enabled !== undefined
          ? loadedSettings.notifications_enabled === 'true'
          : defaultSettings.notificationsEnabled,
        dailyReminderTime: loadedSettings.daily_reminder_time || defaultSettings.dailyReminderTime,
        weeklyReviewDay: loadedSettings.weekly_review_day || defaultSettings.weeklyReviewDay,
        onboardingCompleted: loadedSettings.onboarding_completed === 'true',
        userXp: parseInt(loadedSettings.user_xp || '0', 10) || 0,
        userLevel: parseInt(loadedSettings.user_level || '1', 10) || 1,
      };

      set({
        settings: parsedSettings,
        isLoading: false,
        hasLoaded: true,
      });

      console.log('✅ Settings loaded successfully:', parsedSettings);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      set({ 
        error: 'Failed to load settings',
        isLoading: false,
        hasLoaded: true,
        settings: { ...defaultSettings },
      });
    }
  },

  updateSettings: async (updates): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      const settingsToSave: Record<string, string> = {};
      
      // Map updates to database keys
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
      if (updates.onboardingCompleted !== undefined) {
        settingsToSave.onboarding_completed = String(updates.onboardingCompleted);
      }
      if (updates.userXp !== undefined) {
        settingsToSave.user_xp = String(updates.userXp);
      }
      if (updates.userLevel !== undefined) {
        settingsToSave.user_level = String(updates.userLevel);
      }
      
      // Save to database if there are settings to save
      if (Object.keys(settingsToSave).length > 0) {
        await settingsService.setMultiple(settingsToSave);
        console.log('💾 Settings saved to database:', settingsToSave);
      }
      
      // Update state immediately for responsiveness
      set((state) => ({
        settings: {
          ...state.settings,
          ...updates,
        },
        isSaving: false,
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      set({ 
        error: 'Failed to update settings',
        isSaving: false,
      });
      return false;
    }
  },

  completeOnboarding: async (): Promise<boolean> => {
    set({ isSaving: true, error: null });
    try {
      // Save to database
      await settingsService.set('onboarding_completed', 'true');
      console.log('💾 Onboarding status saved to database');
      
      // Update state
      set((state) => ({
        settings: {
          ...state.settings,
          onboardingCompleted: true,
        },
        isSaving: false,
      }));
      
      console.log('✅ Onboarding completed');
      return true;
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      set({ 
        error: 'Failed to complete onboarding',
        isSaving: false,
      });
      return false;
    }
  },

  resetSettings: async () => {
    set({ isSaving: true, error: null });
    try {
      // Reset in database
      await settingsService.setMultiple({
        theme: defaultSettings.theme,
        notifications_enabled: String(defaultSettings.notificationsEnabled),
        daily_reminder_time: defaultSettings.dailyReminderTime,
        weekly_review_day: defaultSettings.weeklyReviewDay,
        onboarding_completed: String(defaultSettings.onboardingCompleted),
        user_xp: String(defaultSettings.userXp),
        user_level: String(defaultSettings.userLevel),
      });
      
      set({ 
        settings: { ...defaultSettings },
        isSaving: false,
        hasLoaded: true,
      });
      
      console.log('✅ Settings reset to defaults');
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      set({ 
        error: 'Failed to reset settings',
        isSaving: false,
      });
    }
  },

  getSetting: (key) => {
    return get().settings[key];
  },

  isOnboardingCompleted: () => {
    return get().settings.onboardingCompleted;
  },
}));

// Export default settings for use elsewhere
export { defaultSettings };

// Helper hook for components
export const useOnboardingStatus = () => {
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  return { onboardingCompleted, completeOnboarding };
};

// Helper hook for theme
export const useThemeSetting = () => {
  const theme = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  
  const setTheme = async (newTheme: string) => {
    return await updateSettings({ theme: newTheme });
  };
  
  return { theme, setTheme };
};