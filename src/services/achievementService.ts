import { getDatabase } from '../database/database';
import { Achievement, UserAchievement } from '../types';

export const achievementService = {
  // Fetch all achievements
  async fetchAll(): Promise<Achievement[]> {
    const db = getDatabase();
    return await db.getAllAsync<Achievement>(
      'SELECT * FROM achievements ORDER BY id'
    );
  },

  // Fetch user achievements (unlocked)
  async fetchUserAchievements(): Promise<(Achievement & UserAchievement)[]> {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT a.*, ua.unlocked_at
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       ORDER BY ua.unlocked_at DESC`
    );
  },

  // Check if achievement is unlocked
  async isUnlocked(achievementId: number): Promise<boolean> {
    const db = getDatabase();
    const result = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_achievements WHERE achievement_id = ?',
      [achievementId]
    );
    return (result[0]?.count || 0) > 0;
  },

  // Unlock achievement
  async unlockAchievement(achievementId: number): Promise<void> {
    const db = getDatabase();
    const alreadyUnlocked = await this.isUnlocked(achievementId);
    
    if (!alreadyUnlocked) {
      await db.runAsync(
        'INSERT INTO user_achievements (achievement_id) VALUES (?)',
        [achievementId]
      );
      console.log(`Achievement ${achievementId} unlocked!`);
    }
  },

  // Check and unlock achievements based on stats
  async checkAndUnlockAchievements(): Promise<Achievement[]> {
    const db = getDatabase();
    const newlyUnlocked: Achievement[] = [];
    
    // Get user stats
    const totalCompleted = await this.getTotalCompletedHabits();
    const currentStreak = await this.getCurrentStreak();
    const totalRoutines = await this.getTotalCompletedRoutines();
    
    // Get all achievements
    const achievements = await this.fetchAll();
    
    for (const achievement of achievements) {
      if (await this.isUnlocked(achievement.id)) continue;
      
      let shouldUnlock = false;
      
      switch (achievement.name) {
        case 'First Step':
          shouldUnlock = totalCompleted >= 1;
          break;
        case '7 Day Discipline':
          shouldUnlock = currentStreak >= 7;
          break;
        case '30 Day Discipline':
          shouldUnlock = currentStreak >= 30;
          break;
        case 'Early Bird':
          shouldUnlock = totalRoutines >= 7;
          break;
        case 'No Excuses':
          shouldUnlock = totalCompleted >= 20;
          break;
        case 'Consistency':
          shouldUnlock = totalCompleted >= 50;
          break;
        case '100 Habits':
          shouldUnlock = totalCompleted >= 100;
          break;
        case 'Routine Master':
          shouldUnlock = totalRoutines >= 30;
          break;
        case 'Perfect Week':
          shouldUnlock = currentStreak >= 7;
          break;
        case 'Dedication':
          shouldUnlock = totalCompleted >= 30;
          break;
      }
      
      if (shouldUnlock) {
        await this.unlockAchievement(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }
    
    return newlyUnlocked;
  },

  // Get total completed habits
  async getTotalCompletedHabits(): Promise<number> {
    const db = getDatabase();
    const result = await db.getAllAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM habit_logs WHERE status = 'completed'"
    );
    return result[0]?.count || 0;
  },

  // Get current streak
  async getCurrentStreak(): Promise<number> {
    const db = getDatabase();
    const logs = await db.getAllAsync<{ log_date: string }>(
      `SELECT DISTINCT log_date
       FROM habit_logs
       WHERE status = 'completed'
       ORDER BY log_date DESC`
    );

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasToday = logs.some(log => log.log_date === todayStr);
    const hasYesterday = logs.some(log => log.log_date === yesterdayStr);

    if (!hasToday && !hasYesterday) return 0;

    let currentDate = hasToday ? today : yesterday;
    
    for (const log of logs) {
      const logDate = new Date(log.log_date);
      logDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor(
        (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === streak) {
        if (diffDays === streak) {
          streak++;
          currentDate = logDate;
        }
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  },

  // Get total completed routines
  async getTotalCompletedRoutines(): Promise<number> {
    const db = getDatabase();
    const result = await db.getAllAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM routine_logs WHERE status = 'completed'"
    );
    return result[0]?.count || 0;
  },

  // Get user XP and level
  async getUserProgress(): Promise<{ xp: number; level: number }> {
    const totalCompleted = await this.getTotalCompletedHabits();
    const level = Math.floor(totalCompleted / 10) + 1;
    const xp = (totalCompleted % 10) * 10;
    
    return { xp, level };
  },
};