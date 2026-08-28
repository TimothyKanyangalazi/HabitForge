import { getDatabase } from '../database/database';

export const statisticsService = {

  async getTotalHabitsCompleted(): Promise<number> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM habit_logs WHERE status = 'completed'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total completed habits:', error);
      return 0;
    }
  },

  // Get total missed habits
  async getTotalHabitsMissed(): Promise<number> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM habit_logs WHERE status = 'missed'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total missed habits:', error);
      return 0;
    }
  },

  // Get total routines completed
  async getTotalRoutinesCompleted(): Promise<number> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM routine_logs WHERE status = 'completed'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total completed routines:', error);
      return 0;
    }
  },

  // Get longest streak
  async getLongestStreak(): Promise<number> {
    try {
      const db = getDatabase();
      const logs = await db.getAllAsync<{ log_date: string }>(
        `SELECT DISTINCT log_date
         FROM habit_logs
         WHERE status = 'completed'
         ORDER BY log_date ASC`
      );

      if (logs.length === 0) return 0;

      let longestStreak = 0;
      let currentStreak = 0;
      let previousDate: Date | null = null;

      for (const log of logs) {
        const currentDate = new Date(log.log_date);
        currentDate.setHours(0, 0, 0, 0);

        if (previousDate) {
          const diffDays = Math.floor(
            (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
        previousDate = currentDate;
      }

      return longestStreak;
    } catch (error) {
      console.error('Error getting longest streak:', error);
      return 0;
    }
  },

  // Get overall completion rate
  async getOverallCompletionRate(): Promise<number> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ total: number; completed: number }>(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
         FROM habit_logs`
      );
      
      const total = result[0]?.total || 0;
      const completed = result[0]?.completed || 0;
      
      return total > 0 ? (completed / total) * 100 : 0;
    } catch (error) {
      console.error('Error getting completion rate:', error);
      return 0;
    }
  },
// Get per-habit streaks
async getHabitStreaks() {
  const db = getDatabase();
  return await db.getAllAsync(
    `SELECT 
      h.id,
      h.name,
      h.icon,
      COUNT(DISTINCT hl.log_date) as current_streak
     FROM habits h
     LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
      AND hl.status = 'completed'
      AND hl.log_date >= date('now', '-30 days')
     WHERE h.archived = 0
     GROUP BY h.id
     ORDER BY current_streak DESC`
  );
},

// Get per-routine streaks
async getRoutineStreaks() {
  const db = getDatabase();
  return await db.getAllAsync(
    `SELECT 
      r.id,
      r.name,
      r.icon,
      r.color,
      COUNT(DISTINCT rl.log_date) as current_streak
     FROM routines r
     LEFT JOIN routine_tasks rt ON r.id = rt.routine_id
     LEFT JOIN routine_logs rl ON rt.id = rl.routine_task_id 
      AND rl.status = 'completed'
      AND rl.log_date >= date('now', '-30 days')
     WHERE r.archived = 0
     GROUP BY r.id
     ORDER BY current_streak DESC`
  );
},
// Get weekly statistics
async getWeeklyStats() {
  const db = getDatabase();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const stats = await db.getAllAsync<{ total: number; completed: number }>(
      `SELECT 
        COUNT(DISTINCT h.id) as total,
        COUNT(DISTINCT CASE WHEN hl.status = 'completed' THEN h.id END) as completed
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.log_date = ?
       WHERE h.archived = 0`,
      [dateStr]
    );
    
    const total = stats[0]?.total || 0;
    const completed = stats[0]?.completed || 0;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    result.push({
      label: days[date.getDay()],
      value: rate,
      completed,
      total,
    });
  }
  
  return result;
},

// Get monthly statistics
async getMonthlyStats() {
  const db = getDatabase();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dateStr = monthStart.toISOString().split('T')[0];
  
  const stats = await db.getAllAsync<{
    total: number;
    completed: number;
    missed: number;
  }>(
    `SELECT 
      COUNT(DISTINCT h.id) as total,
      COUNT(DISTINCT CASE WHEN hl.status = 'completed' THEN h.id END) as completed,
      COUNT(DISTINCT CASE WHEN hl.status = 'missed' THEN h.id END) as missed
     FROM habits h
     LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
      AND hl.log_date >= ?
     WHERE h.archived = 0`,
    [dateStr]
  );
  
  return stats[0] || { total: 0, completed: 0, missed: 0 };
},

// Get heatmap data
async getHeatmapData(days = 30) {
  const db = getDatabase();
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const stats = await db.getAllAsync<{ total: number; completed: number }>(
      `SELECT 
        COUNT(DISTINCT h.id) as total,
        COUNT(DISTINCT CASE WHEN hl.status = 'completed' THEN h.id END) as completed
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.log_date = ?
       WHERE h.archived = 0`,
      [dateStr]
    );
    
    const total = stats[0]?.total || 0;
    const completed = stats[0]?.completed || 0;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    result.push({
      date: dateStr,
      completionRate: rate,
    });
  }
  
  return result;
},

// Get habit completion trends
async getHabitTrends() {
  const db = getDatabase();
  return await db.getAllAsync(
    `SELECT 
      h.name,
      h.icon,
      COUNT(DISTINCT CASE WHEN hl.status = 'completed' THEN hl.id END) as completed_count,
      COUNT(DISTINCT hl.id) as total_count
     FROM habits h
     LEFT JOIN habit_logs hl ON h.id = hl.habit_id
     WHERE h.archived = 0
     GROUP BY h.id
     ORDER BY completed_count DESC
     LIMIT 5`
  );
},

// Get excuse patterns
async getExcusePatterns() {
  const db = getDatabase();
  return await db.getAllAsync(
    `SELECT 
      e.text,
      COUNT(hl.id) as count
     FROM excuses e
     JOIN habit_logs hl ON hl.excuse_id = e.id
     GROUP BY e.id
     ORDER BY count DESC
     LIMIT 5`
  );
},
  // Get today's stats
  async getTodayStats(date: string) {
    const db = getDatabase();
    
    // Get habit stats
    const habitStats = await db.getAllAsync<{
      total: number;
      completed: number;
    }>(
      `SELECT 
        COUNT(DISTINCT h.id) as total,
        COUNT(DISTINCT CASE WHEN hl.status = 'completed' THEN h.id END) as completed
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.log_date = ?
       WHERE h.archived = 0`,
      [date]
    );

    // Get routine stats
    const routineStats = await db.getAllAsync<{
      total: number;
      completed: number;
    }>(
      `SELECT 
        COUNT(DISTINCT rt.id) as total,
        COUNT(DISTINCT CASE WHEN rl.status = 'completed' THEN rt.id END) as completed
       FROM routines r
       JOIN routine_tasks rt ON r.id = rt.routine_id
       LEFT JOIN routine_logs rl ON rt.id = rl.routine_task_id AND rl.log_date = ?
       WHERE r.archived = 0`,
      [date]
    );

    // Always return valid data
    return {
      habits: habitStats[0] || { total: 0, completed: 0 },
      routines: routineStats[0] || { total: 0, completed: 0 },
    };
  },

  // Get current streak
  async getCurrentStreak(): Promise<number> {
    try {
      const db = getDatabase();
      
      const logs = await db.getAllAsync<{ log_date: string }>(
        `SELECT DISTINCT log_date
         FROM habit_logs
         WHERE status = 'completed'
         ORDER BY log_date DESC`
      );

      if (!logs || logs.length === 0) return 0;

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
    } catch (error) {
      console.error('Error in getCurrentStreak:', error);
      return 0;
    }
  },

  // Get quote of the day
 async getQuoteOfDay() {
    try {
      const db = getDatabase();
      
      // Get total count of quotes
      const countResult = await db.getAllAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM quotes'
      );
      
      const totalQuotes = countResult[0]?.count || 0;
      console.log('Total quotes in database:', totalQuotes);
      
      if (totalQuotes === 0) {
        console.log('No quotes found, using default');
        return { 
          text: 'Discipline is the bridge between goals and accomplishment.', 
          author: 'Jim Rohn' 
        };
      }
      
      // Get a random quote
      const randomIndex = Math.floor(Math.random() * totalQuotes);
      console.log('Fetching random quote at index:', randomIndex);
      
      const result = await db.getAllAsync<{
        text: string;
        author: string;
      }>(
        'SELECT text, author FROM quotes LIMIT 1 OFFSET ?',
        [randomIndex]
      );
      
      console.log('Quote result:', result);
      
      if (result[0] && result[0].text) {
        return result[0];
      }
      
      return { 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return { 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      };
    }
  },

  // Get random quote (different from quote of day)
  async getRandomQuote() {
    try {
      const db = getDatabase();
      
      const countResult = await db.getAllAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM quotes'
      );
      
      const totalQuotes = countResult[0]?.count || 0;
      
      if (totalQuotes === 0) {
        return { 
          text: 'Discipline is the bridge between goals and accomplishment.', 
          author: 'Jim Rohn' 
        };
      }
      
      const randomIndex = Math.floor(Math.random() * totalQuotes);
      
      const result = await db.getAllAsync<{
        text: string;
        author: string;
      }>(
        'SELECT text, author FROM quotes LIMIT 1 OFFSET ?',
        [randomIndex]
      );
      
      return result[0] || { 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      };
    } catch (error) {
      console.error('Error getting random quote:', error);
      return { 
        text: 'Discipline is the bridge between goals and accomplishment.', 
        author: 'Jim Rohn' 
      };
    }
  },

  // Get today's routine progress
  async getTodayRoutines(date: string) {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync(
        `SELECT 
          r.id,
          r.name,
          r.icon,
          r.color,
          r.start_time,
          COUNT(rt.id) as total_tasks,
          COUNT(CASE WHEN rl.status = 'completed' THEN 1 END) as completed_tasks
         FROM routines r
         LEFT JOIN routine_tasks rt ON r.id = rt.routine_id
         LEFT JOIN routine_logs rl ON rt.id = rl.routine_task_id AND rl.log_date = ?
         WHERE r.archived = 0
         GROUP BY r.id
         ORDER BY r.start_time`,
        [date]
      );
      return result || [];
    } catch (error) {
      console.error('Error getting today routines:', error);
      return [];
    }
  },
};