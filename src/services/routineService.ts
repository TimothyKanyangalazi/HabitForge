import { getDatabase } from '../database/database';
import { Routine, RoutineTask, RoutineLog } from '../types';

export const routineService = {
  // Fetch all active routines
  async fetchAll(): Promise<Routine[]> {
    const db = getDatabase();
    return await db.getAllAsync<Routine>(
      'SELECT * FROM routines WHERE archived = 0 ORDER BY created_at DESC'
    );
  },

  // Fetch routine by ID with tasks
  async fetchById(id: number): Promise<(Routine & { tasks: RoutineTask[] }) | null> {
    const db = getDatabase();
    const routine = await db.getAllAsync<Routine>(
      'SELECT * FROM routines WHERE id = ?',
      [id]
    );

    if (!routine[0]) return null;

    const tasks = await db.getAllAsync<RoutineTask>(
      'SELECT * FROM routine_tasks WHERE routine_id = ? ORDER BY order_index',
      [id]
    );

    return { ...routine[0], tasks };
  },

  // Create new routine
  async create(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO routines (name, description, icon, color, start_time, days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        routine.name,
        routine.description || null,
        routine.icon || null,
        routine.color || null,
        routine.start_time || null,
        routine.days || null,
      ]
    );
    return result.lastInsertRowId;
  },

  // Update routine
  async update(id: number, routine: Partial<Routine>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (routine.name !== undefined) { updates.push('name = ?'); values.push(routine.name); }
    if (routine.description !== undefined) { updates.push('description = ?'); values.push(routine.description); }
    if (routine.icon !== undefined) { updates.push('icon = ?'); values.push(routine.icon); }
    if (routine.color !== undefined) { updates.push('color = ?'); values.push(routine.color); }
    if (routine.start_time !== undefined) { updates.push('start_time = ?'); values.push(routine.start_time); }
    if (routine.days !== undefined) { updates.push('days = ?'); values.push(routine.days); }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    await db.runAsync(
      `UPDATE routines SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Archive routine
  async archive(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('UPDATE routines SET archived = 1 WHERE id = ?', [id]);
  },

  // Delete routine
  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);
  },

  // Add task to routine
  async addTask(task: Omit<RoutineTask, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO routine_tasks (routine_id, habit_id, task_name, order_index, duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        task.routine_id,
        task.habit_id || null,
        task.task_name,
        task.order_index,
        task.duration_minutes || 5,
      ]
    );
    return result.lastInsertRowId;
  },

  // Update task
  async updateTask(id: number, task: Partial<RoutineTask>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (task.task_name !== undefined) { updates.push('task_name = ?'); values.push(task.task_name); }
    if (task.order_index !== undefined) { updates.push('order_index = ?'); values.push(task.order_index); }
    if (task.duration_minutes !== undefined) { updates.push('duration_minutes = ?'); values.push(task.duration_minutes); }

    values.push(id);
    await db.runAsync(
      `UPDATE routine_tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete task
  async deleteTask(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM routine_tasks WHERE id = ?', [id]);
  },

  // Log routine task completion
  async logTask(log: Omit<RoutineLog, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    
    const existing = await db.getAllAsync<RoutineLog>(
      'SELECT * FROM routine_logs WHERE routine_task_id = ? AND log_date = ?',
      [log.routine_task_id, log.log_date]
    );

    if (existing.length > 0) {
      await db.runAsync(
        'UPDATE routine_logs SET status = ?, completed_at = ? WHERE id = ?',
        [log.status, log.completed_at || null, existing[0].id]
      );
      return existing[0].id;
    }

    const result = await db.runAsync(
      `INSERT INTO routine_logs (routine_task_id, log_date, status, completed_at)
       VALUES (?, ?, ?, ?)`,
      [log.routine_task_id, log.log_date, log.status, log.completed_at || null]
    );
    return result.lastInsertRowId;
  },

  // Get logs for a specific date
  async getLogsByDate(date: string): Promise<RoutineLog[]> {
    const db = getDatabase();
    return await db.getAllAsync<RoutineLog>(
      'SELECT * FROM routine_logs WHERE log_date = ?',
      [date]
    );
  },

  // Get logs for a specific task
  async getLogsByTask(taskId: number): Promise<RoutineLog[]> {
    const db = getDatabase();
    return await db.getAllAsync<RoutineLog>(
      'SELECT * FROM routine_logs WHERE routine_task_id = ? ORDER BY log_date DESC',
      [taskId]
    );
  },

  // Get routine progress for a date
  async getRoutineProgress(routineId: number, date: string): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    const db = getDatabase();
    const result = await db.getAllAsync<{ total: number; completed: number }>(
      `SELECT 
        COUNT(DISTINCT rt.id) as total,
        COUNT(DISTINCT CASE WHEN rl.status = 'completed' THEN rt.id END) as completed
       FROM routine_tasks rt
       LEFT JOIN routine_logs rl ON rt.id = rl.routine_task_id AND rl.log_date = ?
       WHERE rt.routine_id = ?`,
      [date, routineId]
    );

    const total = result[0]?.total || 0;
    const completed = result[0]?.completed || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, percentage };
  },

  // Reorder tasks
  async reorderTasks(routineId: number, taskIds: number[]): Promise<void> {
    const db = getDatabase();
    
    for (let i = 0; i < taskIds.length; i++) {
      await db.runAsync(
        'UPDATE routine_tasks SET order_index = ? WHERE id = ? AND routine_id = ?',
        [i, taskIds[i], routineId]
      );
    }
  },
};