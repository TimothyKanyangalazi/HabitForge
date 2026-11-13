import { getDatabase } from '../database/database';
import type { Relapse, RelapseInput } from '../types';

export const relapseService = {
  async create(input: RelapseInput): Promise<number> {
    const db = await getDatabase();
    const date = input.relapse_date ?? new Date().toISOString();
    const res = await db.runAsync(
      `INSERT INTO relapses (habit_id, relapse_date, trigger, notes, recovery_plan)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.habit_id,
        date,
        input.trigger ?? null,
        input.notes ?? null,
        input.recovery_plan ?? null,
      ]
    );
    return res.lastInsertRowId as number;
  },

  async listForHabit(habitId: number): Promise<Relapse[]> {
    const db = await getDatabase();
    return db.getAllAsync<Relapse>(
      `SELECT * FROM relapses WHERE habit_id = ? ORDER BY relapse_date DESC`,
      [habitId]
    );
  },

  async listAll(): Promise<Relapse[]> {
    const db = await getDatabase();
    return db.getAllAsync<Relapse>(
      `SELECT * FROM relapses ORDER BY relapse_date DESC`
    );
  },

  async update(id: number, patch: Partial<RelapseInput>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    (['relapse_date', 'trigger', 'notes', 'recovery_plan'] as const).forEach((k) => {
      if (patch[k] !== undefined) {
        fields.push(`${k} = ?`);
        values.push(patch[k]);
      }
    });
    if (!fields.length) return;
    values.push(id);
    await db.runAsync(`UPDATE relapses SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM relapses WHERE id = ?`, [id]);
  },
};