import { SQLiteDatabase } from 'expo-sqlite';
import { columnExists, tableExists } from './migrations';

export async function seedDatabase(db: SQLiteDatabase) {
  try {
    console.log('Checking if database needs seeding...');
    
    // Check if categories table exists and has data
    const categoryCount = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );

    if (categoryCount[0]?.count > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    // Seed categories
    await db.execAsync(`
      INSERT INTO categories (name, color, icon) VALUES
      ('Health', '#4CAF50', 'fitness'),
      ('Learning', '#2196F3', 'book'),
      ('Productivity', '#FF9800', 'briefcase'),
      ('Mindfulness', '#9C27B0', 'leaf'),
      ('Finance', '#F44336', 'cash'),
      ('Social', '#00BCD4', 'people'),
      ('Creativity', '#E91E63', 'brush');
    `);

    // Seed achievements
    await db.execAsync(`
      INSERT OR IGNORE INTO achievements (name, description, icon, xp_reward, criteria) VALUES
      ('First Step', 'Complete your first habit', 'checkmark-circle', 10, '{"type": "habit_completions", "count": 1}'),
      ('7 Day Discipline', 'Maintain a 7-day streak', 'flame', 50, '{"type": "streak", "days": 7}'),
      ('30 Day Discipline', 'Maintain a 30-day streak', 'trophy', 200, '{"type": "streak", "days": 30}'),
      ('Early Bird', 'Complete your morning routine 7 times', 'sunny', 50, '{"type": "routine_completions", "count": 7}'),
      ('No Excuses', 'Complete 20 planned habits', 'shield-checkmark', 75, '{"type": "habit_completions", "count": 20}'),
      ('Consistency', 'Reach 90% completion in a month', 'pie-chart', 100, '{"type": "monthly_consistency", "percent": 90}'),
      ('100 Habits', 'Complete 100 habits', 'ribbon', 500, '{"type": "habit_completions", "count": 100}'),
      ('Routine Master', 'Complete 30 routines', 'list', 150, '{"type": "routine_completions", "count": 30}'),
      ('Perfect Week', 'Complete all habits for 7 days', 'star', 100, '{"type": "perfect_week", "days": 7}'),
      ('Dedication', 'Use the app for 30 days', 'calendar', 150, '{"type": "app_usage", "days": 30}');
    `);

    // Seed quotes
    await db.execAsync(`
      INSERT OR IGNORE INTO quotes (text, author, category) VALUES
      ('Discipline is the bridge between goals and accomplishment.', 'Jim Rohn', 'discipline'),
      ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Aristotle', 'habits'),
      ('The secret of getting ahead is getting started.', 'Mark Twain', 'motivation'),
      ('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'persistence'),
      ('The only bad workout is the one that didn''t happen.', 'Unknown', 'fitness'),
      ('Small daily improvements over time lead to stunning results.', 'Robin Sharma', 'improvement'),
      ('Motivation gets you going, but discipline keeps you growing.', 'John C. Maxwell', 'discipline'),
      ('The future depends on what you do today.', 'Mahatma Gandhi', 'action'),
      ('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier', 'persistence'),
      ('You don''t have to be extreme, just consistent.', 'Unknown', 'consistency');
    `);

    // Seed predefined excuses
    await db.execAsync(`
      INSERT OR IGNORE INTO excuses (text, category) VALUES
      ('Too tired', 'predefined'),
      ('No time', 'predefined'),
      ('Forgot', 'predefined'),
      ('No motivation', 'predefined'),
      ('Too difficult', 'predefined'),
      ('Busy', 'predefined'),
      ('Distracted', 'predefined'),
      ('Phone', 'predefined'),
      ('Procrastination', 'predefined'),
      ('Didn''t feel like it', 'predefined');
    `);

    // Seed default settings
    await db.execAsync(`
      INSERT OR IGNORE INTO settings (key, value) VALUES
      ('theme', 'light'),
      ('notifications_enabled', 'true'),
      ('daily_reminder_time', '08:00'),
      ('weekly_review_day', 'Sunday'),
      ('onboarding_completed', 'false'),
      ('user_xp', '0'),
      ('user_level', '1'),
      ('living_motto', '');
    `);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}