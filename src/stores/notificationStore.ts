import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

interface NotificationState {
  hasPermission: boolean;
  scheduledNotifications: any[];
  isLoading: boolean;
  error: string | null;
  
  requestPermission: () => Promise<boolean>;
  scheduleHabitReminder: (habitId: number, habitName: string, time: string) => Promise<void>;
  scheduleRoutineReminder: (routineId: number, routineName: string, time: string) => Promise<void>;
  scheduleDailyReview: (time: string) => Promise<void>;
  scheduleMorningMotivation: (time: string) => Promise<void>;
  cancelAll: () => Promise<void>;
  getAllScheduled: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  hasPermission: false,
  scheduledNotifications: [],
  isLoading: false,
  error: null,

  requestPermission: async () => {
    set({ isLoading: true, error: null });
    try {
      const hasPermission = await notificationService.requestPermissions();
      set({ hasPermission, isLoading: false });
      return hasPermission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      set({ error: 'Failed to request permission', isLoading: false });
      return false;
    }
  },

  scheduleHabitReminder: async (habitId, habitName, time) => {
    try {
      const notificationId = await notificationService.scheduleHabitReminder(
        habitId,
        habitName,
        time
      );
      
      if (notificationId) {
        await notificationService.saveNotificationToDatabase({
          type: 'habit',
          title: 'Habit Reminder',
          body: `Time to complete: ${habitName}`,
          scheduledTime: time,
          notificationId,
        });
      }
    } catch (error) {
      console.error('Error scheduling habit reminder:', error);
      set({ error: 'Failed to schedule reminder' });
    }
  },

  scheduleRoutineReminder: async (routineId, routineName, time) => {
    try {
      const notificationId = await notificationService.scheduleRoutineReminder(
        routineId,
        routineName,
        time
      );
      
      if (notificationId) {
        await notificationService.saveNotificationToDatabase({
          type: 'routine',
          title: 'Routine Reminder',
          body: `Time to start: ${routineName}`,
          scheduledTime: time,
          notificationId,
        });
      }
    } catch (error) {
      console.error('Error scheduling routine reminder:', error);
      set({ error: 'Failed to schedule reminder' });
    }
  },

  scheduleDailyReview: async (time) => {
    try {
      await notificationService.scheduleDailyReview(time);
    } catch (error) {
      console.error('Error scheduling daily review:', error);
      set({ error: 'Failed to schedule daily review' });
    }
  },

  scheduleMorningMotivation: async (time) => {
    try {
      await notificationService.scheduleMorningMotivation(time);
    } catch (error) {
      console.error('Error scheduling morning motivation:', error);
      set({ error: 'Failed to schedule morning motivation' });
    }
  },

  cancelAll: async () => {
    try {
      await notificationService.cancelAllNotifications();
      set({ scheduledNotifications: [] });
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      set({ error: 'Failed to cancel notifications' });
    }
  },

  getAllScheduled: async () => {
    set({ isLoading: true });
    try {
      const notifications = await notificationService.getAllScheduledNotifications();
      set({ scheduledNotifications: notifications, isLoading: false });
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      set({ error: 'Failed to get notifications', isLoading: false });
    }
  },
}));