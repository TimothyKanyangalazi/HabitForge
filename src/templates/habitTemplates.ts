export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  target_count: number;
}

export const habitTemplates: HabitTemplate[] = [
  {
    id: 'wake-up-early',
    name: 'Wake Up Early',
    description: 'Wake up at the same time every day',
    icon: 'sunny',
    category: 'Health',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'exercise',
    name: 'Exercise',
    description: 'Move your body for at least 20 minutes',
    icon: 'fitness',
    category: 'Health',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'read',
    name: 'Read 20 Pages',
    description: 'Read to expand your knowledge',
    icon: 'book',
    category: 'Learning',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'meditate',
    name: 'Meditate',
    description: 'Practice mindfulness for 10 minutes',
    icon: 'leaf',
    category: 'Mindfulness',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'drink-water',
    name: 'Drink Water',
    description: 'Drink 8 glasses of water',
    icon: 'water',
    category: 'Health',
    frequency_type: 'daily',
    target_count: 8,
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Write down your thoughts and feelings',
    icon: 'journal',
    category: 'Mindfulness',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'study',
    name: 'Study',
    description: 'Study for at least 30 minutes',
    icon: 'school',
    category: 'Learning',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Practice coding for 30 minutes',
    icon: 'code-slash',
    category: 'Productivity',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'plan-tomorrow',
    name: 'Plan Tomorrow',
    description: 'Plan your tasks for tomorrow',
    icon: 'calendar',
    category: 'Productivity',
    frequency_type: 'daily',
    target_count: 1,
  },
  {
    id: 'daily-walk',
    name: 'Daily Walk',
    description: 'Take a 15-minute walk',
    icon: 'walk',
    category: 'Health',
    frequency_type: 'daily',
    target_count: 1,
  },
];

// Helper function to get habit template by ID
export const getHabitTemplateById = (id: string): HabitTemplate | undefined => {
  return habitTemplates.find(template => template.id === id);
};

// Helper function to get templates by category
export const getHabitTemplatesByCategory = (category: string): HabitTemplate[] => {
  return habitTemplates.filter(template => template.category === category);
};