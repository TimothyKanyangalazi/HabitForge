import { getDatabase } from '../database/database';
import { Excuse } from '../types';

export const excuseService = {
  // Fetch all excuses
  async fetchAll(): Promise<Excuse[]> {
    const db = getDatabase();
    return await db.getAllAsync<Excuse>(
      'SELECT * FROM excuses ORDER BY created_at DESC'
    );
  },

  // Fetch predefined excuses
  async fetchPredefined(): Promise<Excuse[]> {
    const db = getDatabase();
    return await db.getAllAsync<Excuse>(
      "SELECT * FROM excuses WHERE category = 'predefined' ORDER BY id"
    );
  },

  // Fetch custom excuses
  async fetchCustom(): Promise<Excuse[]> {
    const db = getDatabase();
    return await db.getAllAsync<Excuse>(
      "SELECT * FROM excuses WHERE category = 'custom' ORDER BY created_at DESC"
    );
  },

  // Fetch excuse by ID
  async fetchById(id: number): Promise<Excuse | null> {
    const db = getDatabase();
    const result = await db.getAllAsync<Excuse>(
      'SELECT * FROM excuses WHERE id = ?',
      [id]
    );
    return result[0] || null;
  },

  // Create new excuse
  async create(excuse: Omit<Excuse, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO excuses (text, reality_check, action_next_time, category)
       VALUES (?, ?, ?, ?)`,
      [
        excuse.text,
        excuse.reality_check || null,
        excuse.action_next_time || null,
        excuse.category || 'custom',
      ]
    );
    return result.lastInsertRowId;
  },

  // Update excuse
  async update(id: number, excuse: Partial<Excuse>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (excuse.text !== undefined) { updates.push('text = ?'); values.push(excuse.text); }
    if (excuse.reality_check !== undefined) { updates.push('reality_check = ?'); values.push(excuse.reality_check); }
    if (excuse.action_next_time !== undefined) { updates.push('action_next_time = ?'); values.push(excuse.action_next_time); }

    values.push(id);
    await db.runAsync(
      `UPDATE excuses SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete excuse
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM excuses WHERE id = ?', [id]);
  },

  // Get most common excuses
  async getMostCommon(limit = 5): Promise<(Excuse & { count: number })[]> {
    const db = getDatabase();
    return await db.getAllAsync(
      `SELECT e.*, COUNT(hl.id) as count
       FROM excuses e
       JOIN habit_logs hl ON hl.excuse_id = e.id
       GROUP BY e.id
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );
  },

  // Get excuses by category
  async getByCategory(category: string): Promise<Excuse[]> {
    const db = getDatabase();
    return await db.getAllAsync<Excuse>(
      'SELECT * FROM excuses WHERE category = ? ORDER BY created_at DESC',
      [category]
    );
  },

  // Search excuses
  async searchExcuses(query: string): Promise<Excuse[]> {
    const db = getDatabase();
    return await db.getAllAsync<Excuse>(
      'SELECT * FROM excuses WHERE text LIKE ? ORDER BY created_at DESC',
      [`%${query}%`]
    );
  },

  // Get predefined excuses by type
  async getPredefinedByType(type: 'time' | 'energy' | 'motivation' | 'common'): Promise<Excuse[]> {
    const db = getDatabase();
    let excuseTexts: string[] = [];
    
    switch (type) {
      case 'time':
        excuseTexts = ['No time', 'Forgot', 'Busy'];
        break;
      case 'energy':
        excuseTexts = ['Too tired', 'Too difficult'];
        break;
      case 'motivation':
        excuseTexts = ['No motivation', "Didn't feel like it", 'Procrastination'];
        break;
      case 'common':
        excuseTexts = ['Too tired', 'No time', 'Busy'];
        break;
    }

    const placeholders = excuseTexts.map(() => '?').join(',');
    return await db.getAllAsync<Excuse>(
      `SELECT * FROM excuses WHERE category = 'predefined' AND text IN (${placeholders}) ORDER BY id`,
      excuseTexts
    );
  },
};