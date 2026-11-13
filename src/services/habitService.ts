import { getDatabase } from '../database/database';
import type { Habit, HabitInput, HabitLog, HabitType } from '../types';

export const habitService = {
  // ── Create ────────────────────────────────────────────────────────────────
  async create(input: HabitInput): Promise<number> {
    const db = await getDatabase();
    const res = await db.runAsync(
      `INSERT INTO habits
        (name, description, icon, color, frequency_type, target_count,
         habit_type, reason, replacement_activity, cost_per_day, time_per_day_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.description ?? null,
        input.icon,
        input.color,
        input.frequency ?? 'daily',
        input.target_count ?? 1,
        input.habit_type ?? 'build',
        input.reason ?? null,
        input.replacement_activity ?? null,
        input.cost_per_day ?? 0,
        input.time_per_day_minutes ?? 0,
      ]
    );
    return res.lastInsertRowId as number;
  },

  // ── Update ────────────────────────────────────────────────────────────────
  async update(id: number, input: Partial<HabitInput>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    (Object.keys(input) as (keyof HabitInput)[]).forEach((k) => {
      if (input[k] !== undefined) {
        fields.push(`${k} = ?`);
        values.push(input[k]);
      }
    });
    if (!fields.length) return;

    fields.push('updated_at = datetime("now")');
    values.push(id);

    await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  // ── Read ──────────────────────────────────────────────────────────────────
  // Fetch all active habits (optionally filtered by type)
  async list(type?: HabitType): Promise<Habit[]> {
    const db = await getDatabase();
    return db.getAllAsync<Habit>(
      `SELECT * FROM habits
       WHERE (archived IS NULL OR archived = 0) ${type ? 'AND habit_type = ?' : ''}
       ORDER BY created_at DESC`,
      type ? [type] : []
    );
  },

  async listByType(type: 'build' | 'break'): Promise<Habit[]> {
    const db = await getDatabase();
    return db.getAllAsync<Habit>(
      `SELECT * FROM habits
       WHERE (archived IS NULL OR archived = 0) AND habit_type = ?
       ORDER BY created_at DESC`,
      [type]
    );
  },

  async listArchived(): Promise<Habit[]> {
    const db = await getDatabase();
    return db.getAllAsync<Habit>(
      `SELECT * FROM habits WHERE archived = 1 ORDER BY created_at DESC`
    );
  },

  async getById(id: number): Promise<Habit | null> {
    const db = await getDatabase();
    return db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?`, [id]);
  },

  // ── Archive / Delete ──────────────────────────────────────────────────────
  async archive(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE habits SET archived = 1, updated_at = datetime("now") WHERE id = ?',
      [id]
    );
  },

  async unarchive(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE habits SET archived = 0, updated_at = datetime("now") WHERE id = ?',
      [id]
    );
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
  },

  // ── Habit logs ────────────────────────────────────────────────────────────
  // Upsert a log for a given habit + date
  async logHabit(log: Omit<HabitLog, 'id' | 'created_at'>): Promise<number> {
    const db = await getDatabase();

    const existing = await db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?',
      [log.habit_id, log.log_date]
    );

    if (existing.length > 0) {
      await db.runAsync(
        'UPDATE habit_logs SET status = ?, completed_at = ?, excuse_id = ? WHERE id = ?',
        [log.status, log.completed_at || null, log.excuse_id || null, existing[0].id]
      );
      return existing[0].id;
    }

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
    return result.lastInsertRowId as number;
  },

  async getLogsByDate(date: string): Promise<HabitLog[]> {
    const db = await getDatabase();
    return db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE log_date = ?',
      [date]
    );
  },

  async getLogsByHabit(habitId: number): Promise<HabitLog[]> {
    const db = await getDatabase();
    return db.getAllAsync<HabitLog>(
      'SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC',
      [habitId]
    );
  },

  // Habits joined with their log for a specific date
  async getHabitsWithLogs(date: string): Promise<(Habit & { log?: HabitLog })[]> {
    const db = await getDatabase();
    return db.getAllAsync(
      `SELECT h.*, hl.id as log_id, hl.status as log_status, hl.completed_at as log_completed_at
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.log_date = ?
       WHERE h.archived = 0
       ORDER BY h.created_at DESC`,
      [date]
    );
  },
};