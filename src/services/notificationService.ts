import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getDatabase } from '../database/database';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notification!');
      return false;
    }

    return true;
  },

  // Schedule a notification
  async scheduleNotification({
    title,
    body,
    hour,
    minute,
    repeat = 'daily',
    data = {},
  }: {
    title: string;
    body: string;
    hour: number;
    minute: number;
    repeat?: 'daily' | 'weekly' | 'none';
    data?: any;
  }): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const trigger: any = {
        hour,
        minute,
        repeats: repeat !== 'none',
      };

      if (repeat === 'weekly') {
        trigger.weekday = data.weekday || 1; // Monday
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger,
      });

      console.log(`Notification scheduled: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  // Cancel a notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  },

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  // Schedule habit reminder
  async scheduleHabitReminder(
    habitId: number,
    habitName: string,
    reminderTime: string
  ): Promise<string | null> {
    const [hour, minute] = reminderTime.split(':').map(Number);
    
    return await this.scheduleNotification({
      title: 'Habit Reminder',
      body: `Time to complete: ${habitName}`,
      hour,
      minute,
      repeat: 'daily',
      data: { type: 'habit', habitId },
    });
  },

  // Schedule routine reminder
  async scheduleRoutineReminder(
    routineId: number,
    routineName: string,
    startTime: string
  ): Promise<string | null> {
    const [hour, minute] = startTime.split(':').map(Number);
    
    return await this.scheduleNotification({
      title: 'Routine Reminder',
      body: `Time to start: ${routineName}`,
      hour,
      minute,
      repeat: 'daily',
      data: { type: 'routine', routineId },
    });
  },

  async scheduleRoutineTaskCompletion(
    routineId: number,
    routineName: string,
    taskId: number,
    taskName: string,
    endsAt: number
  ): Promise<string | null> {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }

    if (status !== 'granted') return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task complete',
        body: `${taskName} in ${routineName} is complete.`,
        data: { type: 'routine_task_complete', routineId, taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)),
        repeats: false,
      },
    });
  },

  // Schedule daily review reminder
  async scheduleDailyReview(time: string = '21:00'): Promise<string | null> {
    const [hour, minute] = time.split(':').map(Number);
    
    return await this.scheduleNotification({
      title: 'Daily Review',
      body: 'Take a few minutes to review your day and plan tomorrow.',
      hour,
      minute,
      repeat: 'daily',
      data: { type: 'daily_review' },
    });
  },

  // Schedule morning motivation
  async scheduleMorningMotivation(time: string = '08:00'): Promise<string | null> {
    const [hour, minute] = time.split(':').map(Number);
    
    return await this.scheduleNotification({
      title: 'Good Morning!',
      body: 'Start your day with purpose. Complete your morning routine!',
      hour,
      minute,
      repeat: 'daily',
      data: { type: 'morning_motivation' },
    });
  },

  // Get all scheduled notifications
  async getAllScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Save notification to database
  async saveNotificationToDatabase({
    type,
    title,
    body,
    scheduledTime,
    notificationId,
  }: {
    type: string;
    title: string;
    body: string;
    scheduledTime: string;
    notificationId: string;
  }): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO notifications (type, title, body, scheduled_time, enabled)
       VALUES (?, ?, ?, ?, 1)`,
      [type, title, body, scheduledTime]
    );
  },

  // Get notification settings from database
  async getNotificationSettings() {
    const db = getDatabase();
    const result = await db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE key LIKE '%notification%' OR key LIKE '%reminder%'"
    );
    
    const settings: Record<string, string> = {};
    result.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  },

  // Initialize all notifications
  async initializeNotifications(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const settings = await this.getNotificationSettings();
      
      const dailyReminderTime = settings.daily_reminder_time || '08:00';
      const weeklyReviewDay = settings.weekly_review_day || 'Sunday';
      
      // Schedule daily reminders
      await this.scheduleMorningMotivation(dailyReminderTime);
      await this.scheduleDailyReview('21:00');
      
      console.log('Notifications initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },
};