import { getDatabase } from '../database/database';
import { Habit, HabitLog } from '../types';

export const habitService = {
  // Fetch all active habits
  async fetchAll(): Promise<Habit[]> {
    const db = getDatabase();
    return await db.getAllAsync<Habit>(
      'SELECT * FROM habits WHERE archived = 0 ORDER BY created_at DESC'
    );
  },

  // Fetch archived habits
  async fetchArchived(): Promise<Habit[]> {
    const db = getDatabase();
    return await db.getAllAsync<Habit>(
      'SELECT * FROM habits WHERE archived = 1 ORDER BY created_at DESC'
    );
  },

  // Fetch single habit by ID
  async fetchById(id: number): Promise<Habit | null> {
    const db = getDatabase();
    const result = await db.getAllAsync<Habit>(
      'SELECT * FROM habits WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },

  // Create new habit
  async create(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO habits (name, description, category_id, icon, frequency_type, selected_days, reminder_time, target_count, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habit.name,
        habit.description || null,
        habit.category_id || null,
        habit.icon || null,
        habit.frequency_type || 'daily',
        habit.selected_days || null,
        habit.reminder_time || null,
        habit.target_count || 1,
        habit.start_date || new Date().toISOString().split('T')[0],
      ]
    );
    return result.lastInsertRowId;
  },

  // Update habit
  async update(id: number, habit: Partial<Habit>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (habit.name !== undefined) { updates.push('name = ?'); values.push(habit.name); }
    if (habit.description !== undefined) { updates.push('description = ?'); values.push(habit.description); }
    if (habit.category_id !== undefined) { updates.push('category_id = ?'); values.push(habit.category_id); }
    if (habit.icon !== undefined) { updates.push('icon = ?'); values.push(habit.icon); }
    if (habit.frequency_type !== undefined) { updates.push('frequency_type = ?'); values.push(habit.frequency_type); }
    if (habit.selected_days !== undefined) { updates.push('selected_days = ?'); values.push(habit.selected_days); }
    if (habit.reminder_time !== undefined) { updates.push('reminder_time = ?'); values.push(habit.reminder_time); }
    if (habit.target_count !== undefined) { updates.push('target_count = ?'); values.push(habit.target_count); }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    await db.runAsync(
      `UPDATE habits SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Archive habit
  async archive(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE habits SET archived = 1, updated_at = datetime("now") WHERE id = ?', [id]);
  },

  // Unarchive habit
  async unarchive(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE habits SET archived = 0, updated_at = datetime("now") WHERE id = ?', [id]);
  },

  // Delete habit permanently
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
  },

  // Log habit completion
  async logHabit(log: Omit<HabitLog, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    
    // Check if log already exists for this date
    const existing = await db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?',
      [log.habit_id, log.log_date]
    );

    if (existing.length > 0) {
      // Update existing log
      await db.runAsync(
        'UPDATE habit_logs SET status = ?, completed_at = ?, excuse_id = ? WHERE id = ?',
        [log.status, log.completed_at || null, log.excuse_id || null, existing[0].id]
      );
      return existing[0].id;
    }

    // Create new log
    const result = await db.runAsync(
      `INSERT INTO habit_logs (habit_id, log_date, status, completed_at, excuse_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        log.habit_id,
        log.log_date,
        log.status,
        log.completed_at || null,
        log.excuse_id || null,
      ]
    );
    return result.lastInsertRowId;
  },

  // Get logs for a specific date
  async getLogsByDate(date: string): Promise<HabitLog[]> {
    const db = getDatabase();
    return await db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE log_date = ?',
      [date]
    );
  },

  // Get logs for a habit
  async getLogsByHabit(habitId: number): Promise<HabitLog[]> {
    const db = getDatabase();
    return await db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC',
      [habitId]
    );
  },

  // Get habit with logs for a specific date
  async getHabitsWithLogs(date: string): Promise<(Habit & { log?: HabitLog })[]> {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT h.*, hl.id as log_id, hl.status as log_status, hl.completed_at as log_completed_at
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.log_date = ?
       WHERE h.archived = 0
       ORDER BY h.created_at DESC`,
      [date]
    );
  },
};