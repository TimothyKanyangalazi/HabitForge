import { getDatabase } from '../database/database';

export const settingsService = {
  // Get setting by key
  async get(key: string): Promise<string | null> {
    const db = getDatabase();
    const result = await db.getAllAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return result[0]?.value || null;
  },

  // Set setting
  async set(key: string, value: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [key, value]
    );
  },

  // Get multiple settings
  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    const db = getDatabase();
    const placeholders = keys.map(() => '?').join(',');
    const result = await db.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
      keys
    );
    
    const settings: Record<string, string> = {};
    result.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  },

  // Set multiple settings
  async setMultiple(settings: Record<string, string>): Promise<void> {
    const db = getDatabase();
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        [key, value]
      );
    }
  },

  // Check if onboarding is completed
  async isOnboardingCompleted(): Promise<boolean> {
    const value = await this.get('onboarding_completed');
    return value === 'true';
  },

  // Mark onboarding as completed
  async completeOnboarding(): Promise<void> {
    await this.set('onboarding_completed', 'true');
  },
};