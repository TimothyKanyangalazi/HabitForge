import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getDatabase } from '../database/database';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only configure notification handler if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const notificationService = {
  // Check if notifications are supported
  isNotificationsSupported(): boolean {
    if (isExpoGo) {
      console.log('ℹ️ Notifications disabled in Expo Go');
      return false;
    }
    return Device.isDevice;
  },

  // Request permissions - returns false in Expo Go
  async requestPermissions(): Promise<boolean> {
    if (isExpoGo) {
      console.log('ℹ️ Skipping notification permissions in Expo Go');
      return false;
    }
    
    if (!Device.isDevice) {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  // Schedule notification - returns null in Expo Go
  async scheduleNotification(params: any): Promise<string | null> {
    if (isExpoGo) {
      console.log('ℹ️ Skipping notification scheduling in Expo Go');
      return null;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const { title, body, hour, minute, data = {} } = params;
      
      const trigger: any = {
        type: 'daily',
        hour,
        minute,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  // All other methods return null/false in Expo Go
  async scheduleHabitReminder(...args: any[]): Promise<string | null> {
    if (isExpoGo) return null;
    const [habitId, habitName, reminderTime] = args;
    const [hour, minute] = reminderTime.split(':').map(Number);
    return this.scheduleNotification({
      title: 'Habit Reminder',
      body: `Time to complete: ${habitName}`,
      hour,
      minute,
      data: { type: 'habit', habitId },
    });
  },

  async scheduleRoutineReminder(...args: any[]): Promise<string | null> {
    if (isExpoGo) return null;
    const [routineId, routineName, startTime] = args;
    const [hour, minute] = startTime.split(':').map(Number);
    return this.scheduleNotification({
      title: 'Routine Reminder',
      body: `Time to start: ${routineName}`,
      hour,
      minute,
      data: { type: 'routine', routineId },
    });
  },

  async scheduleDailyReview(time: string = '21:00'): Promise<string | null> {
    if (isExpoGo) return null;
    const [hour, minute] = time.split(':').map(Number);
    return this.scheduleNotification({
      title: 'Daily Review',
      body: 'Take a few minutes to review your day.',
      hour,
      minute,
      data: { type: 'daily_review' },
    });
  },

  async scheduleMorningMotivation(time: string = '08:00'): Promise<string | null> {
    if (isExpoGo) return null;
    const [hour, minute] = time.split(':').map(Number);
    return this.scheduleNotification({
      title: 'Good Morning!',
      body: 'Start your day with purpose!',
      hour,
      minute,
      data: { type: 'morning_motivation' },
    });
  },

  async cancelNotification(notificationId: string): Promise<void> {
    if (isExpoGo) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    if (isExpoGo) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  async getAllScheduledNotifications(): Promise<any[]> {
    if (isExpoGo) return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  async initializeNotifications(): Promise<void> {
    if (isExpoGo) {
      console.log('ℹ️ Notifications initialization skipped in Expo Go');
      return;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const settings = await this.getNotificationSettings();
      const dailyReminderTime = settings.daily_reminder_time || '08:00';
      
      await this.scheduleMorningMotivation(dailyReminderTime);
      await this.scheduleDailyReview('21:00');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },

  async getNotificationSettings(): Promise<Record<string, string>> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key LIKE '%notification%' OR key LIKE '%reminder%'"
      );
      
      const settings: Record<string, string> = {};
      result.forEach(row => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },
};