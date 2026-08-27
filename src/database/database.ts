import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedDatabase } from './seed';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('habitforge.db');
  }
  return db;
}

export async function resetDatabase() {
  try {
    const database = getDatabase();
    
    // Drop all tables in correct order (respecting foreign keys)
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
      'migrations',
    ];

    // Disable foreign keys temporarily
    await database.execAsync('PRAGMA foreign_keys = OFF');
    
    for (const table of tables) {
      try {
        await database.execAsync(`DROP TABLE IF EXISTS ${table}`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.warn(`Could not drop table ${table}:`, error);
      }
    }
    
    // Re-enable foreign keys
    await database.execAsync('PRAGMA foreign_keys = ON');
    
    console.log('Database reset complete');
  } catch (error) {
    console.error('Database reset error:', error);
    throw error;
  }
}

export async function initDatabase() {
  try {
    const database = getDatabase();
    
    // Enable WAL mode and foreign keys
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
    
    console.log('Database connection established');
    
    // Run migrations
    await runMigrations(database);
    
    // Seed initial data
    await seedDatabase(database);
    
    console.log('Database initialization complete');
    
    return database;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('Database connection closed');
  }
}