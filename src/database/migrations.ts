import { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

interface Migration {
  version: number;
  name: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: CREATE_TABLES_SQL,
  },
];

export async function runMigrations(db: SQLiteDatabase) {
  try {
    // Create migrations table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Get current migration version
    const result = await db.getAllAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM migrations'
    );
    
    const currentVersion = result[0]?.version || 0;

    console.log(`Current migration version: ${currentVersion}`);

    // Apply pending migrations
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Applying migration ${migration.version}: ${migration.name}`);
        
        await db.execAsync('BEGIN TRANSACTION');
        try {
          await db.execAsync(migration.up);
          await db.runAsync(
            'INSERT INTO migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name]
          );
          await db.execAsync('COMMIT');
          console.log(`Migration ${migration.version} applied successfully`);
        } catch (error) {
          await db.execAsync('ROLLBACK');
          console.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Helper function to check if a column exists
export async function columnExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );
  return result.some(col => col.name === columnName);
}

// Helper function to check if a table exists
export async function tableExists(
  db: SQLiteDatabase,
  tableName: string
): Promise<boolean> {
  const result = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return result.length > 0;
}