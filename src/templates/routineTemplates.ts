export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  start_time: string;
  days: number[];
  tasks: Array<{
    task_name: string;
    duration_minutes: number;
    order_index: number;
  }>;
}

export const routineTemplates: RoutineTemplate[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day with energy and purpose',
    icon: 'sunny',
    color: '#FF9800',
    start_time: '06:00',
    days: [1, 2, 3, 4, 5, 6, 7],
    tasks: [
      { task_name: 'Wake Up', duration_minutes: 5, order_index: 0 },
      { task_name: 'Drink Water', duration_minutes: 5, order_index: 1 },
      { task_name: 'Make Bed', duration_minutes: 5, order_index: 2 },
      { task_name: 'Exercise', duration_minutes: 20, order_index: 3 },
      { task_name: 'Meditate', duration_minutes: 10, order_index: 4 },
      { task_name: 'Plan Day', duration_minutes: 10, order_index: 5 },
    ],
  },
  {
    id: 'night-routine',
    name: 'Night Routine',
    description: 'Wind down and prepare for a restful sleep',
    icon: 'moon',
    color: '#9C27B0',
    start_time: '21:00',
    days: [1, 2, 3, 4, 5, 6, 7],
    tasks: [
      { task_name: 'Review Day', duration_minutes: 10, order_index: 0 },
      { task_name: 'Journal', duration_minutes: 10, order_index: 1 },
      { task_name: 'Prepare Tomorrow', duration_minutes: 10, order_index: 2 },
      { task_name: 'Read', duration_minutes: 20, order_index: 3 },
      { task_name: 'Prepare for Sleep', duration_minutes: 10, order_index: 4 },
    ],
  },
  {
    id: 'study-routine',
    name: 'Study Routine',
    description: 'Maximize your learning and retention',
    icon: 'book',
    color: '#2196F3',
    start_time: '14:00',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Prepare Workspace', duration_minutes: 5, order_index: 0 },
      { task_name: 'Set Study Goal', duration_minutes: 5, order_index: 1 },
      { task_name: 'Study', duration_minutes: 45, order_index: 2 },
      { task_name: 'Take Short Break', duration_minutes: 10, order_index: 3 },
      { task_name: 'Practice Questions', duration_minutes: 20, order_index: 4 },
      { task_name: 'Review Notes', duration_minutes: 15, order_index: 5 },
    ],
  },
  {
    id: 'coding-routine',
    name: 'Coding Routine',
    description: 'Stay focused and productive while coding',
    icon: 'code-slash',
    color: '#4CAF50',
    start_time: '09:00',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Plan Task', duration_minutes: 10, order_index: 0 },
      { task_name: 'Code', duration_minutes: 45, order_index: 1 },
      { task_name: 'Test', duration_minutes: 15, order_index: 2 },
      { task_name: 'Debug', duration_minutes: 20, order_index: 3 },
      { task_name: 'Commit Changes', duration_minutes: 5, order_index: 4 },
      { task_name: 'Write Notes', duration_minutes: 10, order_index: 5 },
    ],
  },
  {
    id: 'fitness-routine',
    name: 'Fitness Routine',
    description: 'Build strength and maintain health',
    icon: 'fitness',
    color: '#F44336',
    start_time: '17:00',
    days: [1, 3, 5],
    tasks: [
      { task_name: 'Warm Up', duration_minutes: 10, order_index: 0 },
      { task_name: 'Workout', duration_minutes: 30, order_index: 1 },
      { task_name: 'Cool Down', duration_minutes: 10, order_index: 2 },
      { task_name: 'Drink Water', duration_minutes: 5, order_index: 3 },
      { task_name: 'Record Progress', duration_minutes: 5, order_index: 4 },
    ],
  },
  {
    id: 'self-improvement',
    name: 'Self-Improvement Routine',
    description: 'Invest in yourself every day',
    icon: 'trending-up',
    color: '#00BCD4',
    start_time: '18:00',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Read', duration_minutes: 20, order_index: 0 },
      { task_name: 'Journal', duration_minutes: 10, order_index: 1 },
      { task_name: 'Meditate', duration_minutes: 10, order_index: 2 },
      { task_name: 'Learn Something New', duration_minutes: 20, order_index: 3 },
      { task_name: 'Review Goals', duration_minutes: 10, order_index: 4 },
    ],
  },
  {
    id: 'music-production',
    name: 'Music Production Routine',
    description: 'Create music consistently',
    icon: 'musical-notes',
    color: '#E91E63',
    start_time: '19:00',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Idea Generation', duration_minutes: 15, order_index: 0 },
      { task_name: 'Sound Selection', duration_minutes: 15, order_index: 1 },
      { task_name: 'Beat/Composition', duration_minutes: 30, order_index: 2 },
      { task_name: 'Arrangement', duration_minutes: 20, order_index: 3 },
      { task_name: 'Mix', duration_minutes: 20, order_index: 4 },
      { task_name: 'Export', duration_minutes: 10, order_index: 5 },
      { task_name: 'Review', duration_minutes: 10, order_index: 6 },
    ],
  },
  {
    id: 'exam-preparation',
    name: 'Exam Preparation Routine',
    description: 'Prepare effectively for exams',
    icon: 'school',
    color: '#FF5722',
    start_time: '15:00',
    days: [1, 2, 3, 4, 5, 6],
    tasks: [
      { task_name: 'Choose Topic', duration_minutes: 5, order_index: 0 },
      { task_name: 'Review Notes', duration_minutes: 20, order_index: 1 },
      { task_name: 'Practice Questions', duration_minutes: 30, order_index: 2 },
      { task_name: 'Identify Weak Areas', duration_minutes: 10, order_index: 3 },
      { task_name: 'Revise', duration_minutes: 20, order_index: 4 },
      { task_name: 'Test Yourself', duration_minutes: 15, order_index: 5 },
    ],
  },
  {
    id: 'productivity-morning',
    name: 'Productive Morning Routine',
    description: 'Crush your morning and own your day',
    icon: 'rocket',
    color: '#3F51B5',
    start_time: '05:30',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Wake Up Early', duration_minutes: 5, order_index: 0 },
      { task_name: 'Hydrate', duration_minutes: 5, order_index: 1 },
      { task_name: 'Exercise', duration_minutes: 15, order_index: 2 },
      { task_name: 'Meditate', duration_minutes: 10, order_index: 3 },
      { task_name: 'Review Goals', duration_minutes: 5, order_index: 4 },
      { task_name: 'Most Important Task', duration_minutes: 25, order_index: 5 },
    ],
  },
  {
    id: 'creative-routine',
    name: 'Creative Routine',
    description: 'Unlock your creative potential',
    icon: 'brush',
    color: '#795548',
    start_time: '10:00',
    days: [1, 2, 3, 4, 5],
    tasks: [
      { task_name: 'Clear Workspace', duration_minutes: 5, order_index: 0 },
      { task_name: 'Brainstorm Ideas', duration_minutes: 15, order_index: 1 },
      { task_name: 'Create', duration_minutes: 45, order_index: 2 },
      { task_name: 'Take Break', duration_minutes: 10, order_index: 3 },
      { task_name: 'Refine Work', duration_minutes: 20, order_index: 4 },
      { task_name: 'Document Progress', duration_minutes: 10, order_index: 5 },
    ],
  },
];

// Helper function to get template by ID
export const getTemplateById = (id: string): RoutineTemplate | undefined => {
  return routineTemplates.find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): RoutineTemplate[] => {
  // For now, all templates are general
  // You can add category field later if needed
  return routineTemplates;
};

// Helper function to search templates
export const searchTemplates = (query: string): RoutineTemplate[] => {
  const searchTerm = query.toLowerCase();
  return routineTemplates.filter(
    template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tasks.some(task => task.task_name.toLowerCase().includes(searchTerm))
  );
};

// Helper function to get total duration of a template
export const getTemplateDuration = (template: RoutineTemplate): number => {
  return template.tasks.reduce((total, task) => total + task.duration_minutes, 0);
};

// Helper function to get number of tasks in a template
export const getTemplateTaskCount = (template: RoutineTemplate): number => {
  return template.tasks.length;
};