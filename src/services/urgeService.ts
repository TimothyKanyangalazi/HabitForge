import { getDatabase } from '../database/database';
import type { Urge, UrgeInput, BreakHabitStats } from '../types';

export const urgeService = {
  async create(input: UrgeInput): Promise<number> {
    const db = await getDatabase();
    const loggedAt = input.logged_at ?? new Date().toISOString();
    const res = await db.runAsync(
      `INSERT INTO urges (habit_id, logged_at, intensity, trigger, outcome, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.habit_id,
        loggedAt,
        Math.max(1, Math.min(10, Math.round(input.intensity))),
        input.trigger ?? null,
        input.outcome,
        input.notes ?? null,
      ]
    );
    return res.lastInsertRowId as number;
  },

  async listForHabit(habitId: number, limit = 200): Promise<Urge[]> {
    const db = await getDatabase();
    return db.getAllAsync<Urge>(
      `SELECT * FROM urges WHERE habit_id = ? ORDER BY logged_at DESC LIMIT ?`,
      [habitId, limit]
    );
  },

  async listAll(): Promise<Urge[]> {
    const db = await getDatabase();
    return db.getAllAsync<Urge>(
      `SELECT * FROM urges ORDER BY logged_at DESC`
    );
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM urges WHERE id = ?`, [id]);
  },

  /**
   * Streak for a break-habit = consecutive days up to today
   * with no relapse (relapses break it) — capped by the last relapse.
   */
  async getStreak(habitId: number): Promise<{ current: number; longest: number }> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{ last: string | null }>(
      `SELECT MAX(relapse_date) AS last FROM relapses WHERE habit_id = ?`,
      [habitId]
    );
    const last = row?.last ?? null;

    // Days since last relapse (or since habit created_at if never relapsed)
    const habit = await db.getFirstAsync<{ created_at: string }>(
      `SELECT created_at FROM habits WHERE id = ?`,
      [habitId]
    );
    const anchor = last ?? habit?.created_at ?? new Date().toISOString();

    const current = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Longest gap between consecutive relapses (and today)
    const relapses = await db.getAllAsync<{ relapse_date: string }>(
      `SELECT relapse_date FROM relapses WHERE habit_id = ? ORDER BY relapse_date ASC`,
      [habitId]
    );
    const dates = [
      new Date(habit?.created_at ?? anchor).getTime(),
      ...relapses.map((r) => new Date(r.relapse_date).getTime()),
      Date.now(),
    ];
    let longest = 0;
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      if (diff > longest) longest = diff;
    }

    return { current, longest };
  },

  async getStats(habitId: number): Promise<BreakHabitStats> {
    const db = await getDatabase();
    const habit = await db.getFirstAsync<{
      cost_per_day: number | null;
      time_per_day_minutes: number | null;
    }>(
      `SELECT cost_per_day, time_per_day_minutes FROM habits WHERE id = ?`,
      [habitId]
    );

    const totals = await db.getFirstAsync<{
      total: number;
      resisted: number;
      relapses: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM urges    WHERE habit_id = ?) AS total,
         (SELECT COUNT(*) FROM urges    WHERE habit_id = ? AND outcome = 'resisted') AS resisted,
         (SELECT COUNT(*) FROM relapses WHERE habit_id = ?) AS relapses`,
      [habitId, habitId, habitId]
    );

    const { current, longest } = await this.getStreak(habitId);
    const lastRelapse = await db.getFirstAsync<{ last: string | null }>(
      `SELECT MAX(relapse_date) AS last FROM relapses WHERE habit_id = ?`,
      [habitId]
    );

    const costPerDay = habit?.cost_per_day ?? 0;
    const timePerDay = habit?.time_per_day_minutes ?? 0;

    return {
      habit_id: habitId,
      current_streak_days: current,
      longest_streak_days: longest,
      total_urges: totals?.total ?? 0,
      resisted_urges: totals?.resisted ?? 0,
      relapses_count: totals?.relapses ?? 0,
      money_saved: +(current * costPerDay).toFixed(2),
      time_reclaimed_minutes: current * timePerDay,
      last_relapse_date: lastRelapse?.last ?? null,
    };
  },
};