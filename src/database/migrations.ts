// src/database/migrations.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function columnExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );
  return cols.some((c) => c.name === columnName);
}

async function tableExists(
  db: SQLiteDatabase,
  tableName: string
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );
  return rows.length > 0;
}

/** Idempotent ADD COLUMN. Safe to run on every launch. */
async function addColumnIfMissing(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string,
  ddl: string
): Promise<boolean> {
  if (await columnExists(db, tableName, columnName)) return false;
  await db.execAsync(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${ddl};`
  );
  return true;
}

// ─────────────────────────────────────────────────────────────
// Migration definitions
// ─────────────────────────────────────────────────────────────
//
// Each `up` is a function so it can make runtime decisions
// (skip-if-exists, branch on data, etc.). Signature:
//   up(db): Promise<void>
//
// IMPORTANT: an `up` must be idempotent w.r.t. columns/tables
// it may have created in a previous, interrupted run.

interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      // CREATE_TABLES_SQL is expected to use CREATE TABLE IF NOT EXISTS.
      // If it doesn't, wrap it — but ideally fix schema.ts instead.
      await db.execAsync(CREATE_TABLES_SQL);
    },
  },
  {
    version: 2,
    name: 'break_habits',
    up: async (db) => {
      // Column adds — idempotent, one at a time so a partial run is recoverable.
      await addColumnIfMissing(
        db,
        'habits',
        'habit_type',
        `TEXT NOT NULL DEFAULT 'build' CHECK (habit_type IN ('build','break'))`
      );
      await addColumnIfMissing(db, 'habits', 'reason', 'TEXT');
      await addColumnIfMissing(db, 'habits', 'replacement_activity', 'TEXT');
      await addColumnIfMissing(db, 'habits', 'cost_per_day', 'REAL DEFAULT 0');
      await addColumnIfMissing(
        db,
        'habits',
        'time_per_day_minutes',
        'INTEGER DEFAULT 0'
      );

      // New tables — IF NOT EXISTS makes them safe to re-run.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS urges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          logged_at TEXT NOT NULL,
          intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
          "trigger" TEXT CHECK (
            "trigger" IS NULL OR
            "trigger" IN ('stress','boredom','social','location','emotion','other')
          ),
          outcome TEXT NOT NULL CHECK (outcome IN ('resisted','gave_in')),
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS relapses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          relapse_date TEXT NOT NULL,
          "trigger" TEXT,
          notes TEXT,
          recovery_plan TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_urges_habit   ON urges(habit_id);
        CREATE INDEX IF NOT EXISTS idx_urges_date    ON urges(logged_at);
        CREATE INDEX IF NOT EXISTS idx_relapses_habit ON relapses(habit_id);
        CREATE INDEX IF NOT EXISTS idx_habits_type   ON habits(habit_type);
      `);
    },
  },
  {
    version: 3,
    name: 'habit_color',
    // Some prior run already added color (either via initial_schema or
    // a partial attempt). addColumnIfMissing handles both cases.
    up: async (db) => {
      await addColumnIfMissing(db, 'habits', 'color', 'TEXT');
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────

async function ensureMigrationsTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function readAppliedVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) AS version FROM migrations'
  );
  return row?.version ?? 0;
}

/**
 * Belt-and-suspenders: also consult `PRAGMA user_version`. This
 * survives a corrupt `migrations` table and lets us short-circuit
 * cleanly on devices where the table got wiped.
 */
async function readUserVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  return row?.user_version ?? 0;
}

async function setUserVersion(db: SQLiteDatabase, v: number): Promise<void> {
  // PRAGMA can't be parameterized — safe here because v is our own int.
  await db.execAsync(`PRAGMA user_version = ${Math.floor(v)};`);
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationsTable(db);

  const appliedVersion = await readAppliedVersion(db);
  const userVersion = await readUserVersion(db);
  const currentVersion = Math.max(appliedVersion, userVersion);

  console.log(
    `[migrations] applied=${appliedVersion} user_version=${userVersion} → current=${currentVersion}`
  );

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    console.log('[migrations] up to date');
    return;
  }

  for (const migration of pending) {
    console.log(
      `[migrations] applying v${migration.version} ${migration.name}`
    );

    // Expo's runAsync/execAsync within `withTransactionAsync` gives us
    // BEGIN/COMMIT/ROLLBACK automatically, including on throw.
    await db.withTransactionAsync(async () => {
      // Re-check inside the transaction so a concurrent runner can't
      // double-apply if two instances try to migrate on the same file.
      const already = await db.getFirstAsync<{ version: number }>(
        'SELECT version FROM migrations WHERE version = ?',
        [migration.version]
      );
      if (already) return;

      await migration.up(db);

      await db.runAsync(
        'INSERT INTO migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
      await setUserVersion(db, migration.version);
    });

    console.log(
      `[migrations] v${migration.version} ${migration.name} applied`
    );
  }

  console.log('[migrations] all completed');
}

// Re-exports used elsewhere
export { columnExists, tableExists };