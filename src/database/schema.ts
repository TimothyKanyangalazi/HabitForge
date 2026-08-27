export const CREATE_TABLES_SQL = `
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    icon TEXT,
    frequency_type TEXT NOT NULL DEFAULT 'daily',
    selected_days TEXT,
    reminder_time TEXT,
    target_count INTEGER DEFAULT 1,
    start_date TEXT NOT NULL DEFAULT (date('now')),
    archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Habit logs table
CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('completed', 'missed', 'skipped')),
    completed_at TEXT,
    excuse_id INTEGER REFERENCES excuses(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(habit_id, log_date)
);

-- Excuses table
CREATE TABLE IF NOT EXISTS excuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    reality_check TEXT,
    action_next_time TEXT,
    category TEXT DEFAULT 'custom',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Routines table
CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    start_time TEXT,
    days TEXT,
    archived INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Routine tasks table
CREATE TABLE IF NOT EXISTS routine_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
    task_name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Routine logs table
CREATE TABLE IF NOT EXISTS routine_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_task_id INTEGER NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
    log_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('completed', 'missed', 'skipped')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(routine_task_id, log_date)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    xp_reward INTEGER DEFAULT 0,
    criteria TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(achievement_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    scheduled_time TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    author TEXT,
    category TEXT DEFAULT 'general'
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_routine ON routine_tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_logs_date ON routine_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_excuses_category ON excuses(category);
`;