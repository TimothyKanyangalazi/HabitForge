import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/database';
import { Platform } from 'react-native';

export const backupService = {
  // Export all data to JSON
  async exportData(): Promise<string> {
    try {
      const db = getDatabase();
      
      // Fetch all data
      const [
        habits,
        habitLogs,
        excuses,
        routines,
        routineTasks,
        routineLogs,
        achievements,
        userAchievements,
        categories,
        settings,
        quotes,
      ] = await Promise.all([
        db.getAllAsync('SELECT * FROM habits'),
        db.getAllAsync('SELECT * FROM habit_logs'),
        db.getAllAsync('SELECT * FROM excuses'),
        db.getAllAsync('SELECT * FROM routines'),
        db.getAllAsync('SELECT * FROM routine_tasks'),
        db.getAllAsync('SELECT * FROM routine_logs'),
        db.getAllAsync('SELECT * FROM achievements'),
        db.getAllAsync('SELECT * FROM user_achievements'),
        db.getAllAsync('SELECT * FROM categories'),
        db.getAllAsync('SELECT * FROM settings'),
        db.getAllAsync('SELECT * FROM quotes'),
      ]);

      const backupData = {
        version: 1,
        exported_at: new Date().toISOString(),
        data: {
          habits,
          habit_logs: habitLogs,
          excuses,
          routines,
          routine_tasks: routineTasks,
          routine_logs: routineLogs,
          achievements,
          user_achievements: userAchievements,
          categories,
          settings,
          quotes,
        },
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      
      // Save to file using legacy API
      const fileName = `habitforge_backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      
      console.log(`Backup saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Share backup file
  async shareBackup(filePath: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export HabitForge Data',
        });
      } else {
        console.log('Sharing not available on this platform');
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      throw error;
    }
  },

  // Import data from JSON
  async importData(jsonData: string): Promise<void> {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.data) {
        throw new Error('Invalid backup file');
      }

      const db = getDatabase();
      
      // Begin transaction
      await db.execAsync('BEGIN TRANSACTION');
      
      try {
        // Clear existing data
        await this.clearAllData();
        
        // Import categories
        for (const category of parsed.data.categories || []) {
          await db.runAsync(
            'INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)',
            [category.id, category.name, category.color, category.icon]
          );
        }
        
        // Import habits
        for (const habit of parsed.data.habits || []) {
          await db.runAsync(
            `INSERT INTO habits (id, name, description, category_id, icon, frequency_type, selected_days, reminder_time, target_count, start_date, archived, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              habit.id,
              habit.name,
              habit.description,
              habit.category_id,
              habit.icon,
              habit.frequency_type,
              habit.selected_days,
              habit.reminder_time,
              habit.target_count,
              habit.start_date,
              habit.archived,
              habit.created_at,
              habit.updated_at,
            ]
          );
        }
        
        // Import excuses
        for (const excuse of parsed.data.excuses || []) {
          await db.runAsync(
            'INSERT INTO excuses (id, text, reality_check, action_next_time, category) VALUES (?, ?, ?, ?, ?)',
            [excuse.id, excuse.text, excuse.reality_check, excuse.action_next_time, excuse.category]
          );
        }
        
        // Import habit logs
        for (const log of parsed.data.habit_logs || []) {
          await db.runAsync(
            'INSERT INTO habit_logs (id, habit_id, log_date, status, completed_at, excuse_id) VALUES (?, ?, ?, ?, ?, ?)',
            [log.id, log.habit_id, log.log_date, log.status, log.completed_at, log.excuse_id]
          );
        }
        
        // Import routines
        for (const routine of parsed.data.routines || []) {
          await db.runAsync(
            'INSERT INTO routines (id, name, description, icon, color, start_time, days, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              routine.id,
              routine.name,
              routine.description,
              routine.icon,
              routine.color,
              routine.start_time,
              routine.days,
              routine.archived,
              routine.created_at,
              routine.updated_at,
            ]
          );
        }
        
        // Import routine tasks
        for (const task of parsed.data.routine_tasks || []) {
          await db.runAsync(
            'INSERT INTO routine_tasks (id, routine_id, habit_id, task_name, order_index, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)',
            [task.id, task.routine_id, task.habit_id, task.task_name, task.order_index, task.duration_minutes]
          );
        }
        
        // Import routine logs
        for (const log of parsed.data.routine_logs || []) {
          await db.runAsync(
            'INSERT INTO routine_logs (id, routine_task_id, log_date, status, completed_at) VALUES (?, ?, ?, ?, ?)',
            [log.id, log.routine_task_id, log.log_date, log.status, log.completed_at]
          );
        }
        
        // Import achievements
        for (const achievement of parsed.data.achievements || []) {
          await db.runAsync(
            'INSERT INTO achievements (id, name, description, icon, xp_reward, criteria) VALUES (?, ?, ?, ?, ?, ?)',
            [achievement.id, achievement.name, achievement.description, achievement.icon, achievement.xp_reward, achievement.criteria]
          );
        }
        
        // Import user achievements
        for (const userAchievement of parsed.data.user_achievements || []) {
          await db.runAsync(
            'INSERT INTO user_achievements (id, achievement_id, unlocked_at) VALUES (?, ?, ?)',
            [userAchievement.id, userAchievement.achievement_id, userAchievement.unlocked_at]
          );
        }
        
        // Import settings
        for (const setting of parsed.data.settings || []) {
          await db.runAsync(
            'INSERT INTO settings (id, key, value) VALUES (?, ?, ?)',
            [setting.id, setting.key, setting.value]
          );
        }
        
        // Import quotes
        for (const quote of parsed.data.quotes || []) {
          await db.runAsync(
            'INSERT INTO quotes (id, text, author, category) VALUES (?, ?, ?, ?)',
            [quote.id, quote.text, quote.author, quote.category]
          );
        }
        
        // Commit transaction
        await db.execAsync('COMMIT');
        console.log('Data imported successfully');
      } catch (error) {
        // Rollback on error
        await db.execAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    const db = getDatabase();
    
    const tables = [
      'routine_logs',
      'habit_logs',
      'user_achievements',
      'routine_tasks',
      'routines',
      'habits',
      'excuses',
      'achievements',
      'quotes',
      'categories',
      'settings',
    ];
    
    for (const table of tables) {
      await db.execAsync(`DELETE FROM ${table}`);
    }
  },

  // Reset database completely
  async resetDatabase(): Promise<void> {
    try {
      const db = getDatabase();
      
      const tables = [
        'routine_logs',
        'habit_logs',
        'user_achievements',
        'routine_tasks',
        'routines',
        'habits',
        'excuses',
        'achievements',
        'notifications',
        'quotes',
        'categories',
        'settings',
      ];
      
      await db.execAsync('PRAGMA foreign_keys = OFF');
      
      for (const table of tables) {
        await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
      }
      
      await db.execAsync('PRAGMA foreign_keys = ON');
      
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  },

  // Get backup info
  async getBackupInfo(): Promise<{
    totalHabits: number;
    totalLogs: number;
    totalRoutines: number;
    totalExcuses: number;
    totalAchievements: number;
  }> {
    const db = getDatabase();
    
    const [habits, logs, routines, excuses, achievements] = await Promise.all([
      db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits'),
      db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM habit_logs'),
      db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM routines'),
      db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM excuses'),
      db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_achievements'),
    ]);
    
    return {
      totalHabits: habits[0]?.count || 0,
      totalLogs: logs[0]?.count || 0,
      totalRoutines: routines[0]?.count || 0,
      totalExcuses: excuses[0]?.count || 0,
      totalAchievements: achievements[0]?.count || 0,
    };
  },
};