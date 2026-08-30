import { getDatabase } from '../database/database';

export const settingsService = {
  // Get setting by key
  async get(key: string): Promise<string | null> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );
      return result[0]?.value || null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  },

  // Set setting
  async set(key: string, value: string): Promise<void> {
    try {
      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        [key, value]
      );
      console.log(`✅ Setting saved: ${key} = ${value}`);
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  },

  // Get multiple settings
  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    try {
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
    } catch (error) {
      console.error('Error getting multiple settings:', error);
      return {};
    }
  },

  // Set multiple settings
  async setMultiple(settings: Record<string, string>): Promise<void> {
    try {
      const db = getDatabase();
      for (const [key, value] of Object.entries(settings)) {
        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
          [key, value]
        );
      }
      console.log('✅ Multiple settings saved');
    } catch (error) {
      console.error('Error setting multiple settings:', error);
      throw error;
    }
  },

  // Check if onboarding is completed
  async isOnboardingCompleted(): Promise<boolean> {
    const value = await this.get('onboarding_completed');
    console.log('📂 Onboarding completed value:', value);
    return value === 'true';
  },

  // Mark onboarding as completed
  async completeOnboarding(): Promise<void> {
    await this.set('onboarding_completed', 'true');
  },

  // Get all settings
  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const db = getDatabase();
      const result = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings'
      );
      
      const settings: Record<string, string> = {};
      result.forEach(row => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  },

  // Delete setting
  async delete(key: string): Promise<void> {
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
      console.log(`✅ Setting deleted: ${key}`);
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  },
};