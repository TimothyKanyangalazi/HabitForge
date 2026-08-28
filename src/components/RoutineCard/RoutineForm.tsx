import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { PrimaryButton } from '../common/PrimaryButton';
import { Routine, RoutineTask } from '../../types';

interface RoutineFormProps {
  initialValues?: Partial<Routine & { tasks: RoutineTask[] }>;
  onSubmit: (values: {
    name: string;
    description?: string;
    icon: string;
    color: string;
    start_time?: string;
    days?: string;
    tasks: Array<{ task_name: string; duration_minutes: number; order_index: number }>;
  }) => Promise<void>;
  onCancel: () => void;
}

const COLORS = [
  '#4A90E2', '#4CAF50', '#FF9800', '#9C27B0', 
  '#F44336', '#00BCD4', '#E91E63', '#8BC34A'
];

const ICONS = [
  'sunny', 'moon', 'book', 'fitness', 'briefcase', 
  'code', 'musical-notes', 'school', 'restaurant', 'bed'
];

export const RoutineForm: React.FC<RoutineFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [startTime, setStartTime] = useState(initialValues?.start_time || '');
  const [icon, setIcon] = useState(initialValues?.icon || 'sunny');
  const [color, setColor] = useState(initialValues?.color || COLORS[0]);
  const [tasks, setTasks] = useState<Array<{ task_name: string; duration_minutes: number; order_index: number }>>(
    initialValues?.tasks?.map(t => ({
      task_name: t.task_name,
      duration_minutes: t.duration_minutes,
      order_index: t.order_index,
    })) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTask = () => {
    setTasks(prev => [
      ...prev,
      {
        task_name: '',
        duration_minutes: 5,
        order_index: prev.length,
      }
    ]);
  };

  const updateTask = (index: number, field: string, value: any) => {
    setTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTask = (index: number) => {
    setTasks(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((task, i) => ({ ...task, order_index: i }));
    });
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    setTasks(prev => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      
      return updated.map((task, i) => ({ ...task, order_index: i }));
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }

    if (tasks.length === 0 || tasks.some(t => !t.task_name.trim())) {
      alert('Please add at least one task with a name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        start_time: startTime || undefined,
        days: JSON.stringify([1, 2, 3, 4, 5]), // Default weekdays
        tasks,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Routine Name</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Morning Routine"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this routine for?"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Start Time</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="06:00"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Icon</Text>
        <View style={styles.iconsContainer}>
          {ICONS.map(iconName => (
            <Pressable
              key={iconName}
              onPress={() => setIcon(iconName)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: icon === iconName ? color : '#f5f5f5',
                },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={24}
                color={icon === iconName ? '#fff' : theme.colors.text}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Color</Text>
        <View style={styles.colorsContainer}>
          {COLORS.map(colorOption => (
            <Pressable
              key={colorOption}
              onPress={() => setColor(colorOption)}
              style={[
                styles.colorButton,
                {
                  backgroundColor: colorOption,
                  borderWidth: color === colorOption ? 3 : 0,
                  borderColor: theme.colors.text,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.tasksHeader}>
          <Text style={[styles.label, { color: theme.colors.text, marginBottom: 0 }]}>
            Tasks
          </Text>
          <Pressable
            onPress={addTask}
            style={[styles.addTaskButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {tasks.map((task, index) => (
          <View key={index} style={[styles.taskItem, { backgroundColor: theme.colors.card }]}>
            <View style={styles.taskOrder}>
              <Text style={[styles.taskOrderText, { color: theme.colors.text }]}>
                {index + 1}
              </Text>
            </View>
            
            <TextInput
              style={[styles.taskInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={task.task_name}
              onChangeText={(text) => updateTask(index, 'task_name', text)}
              placeholder="Task name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <TextInput
              style={[styles.durationInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={String(task.duration_minutes)}
              onChangeText={(text) => updateTask(index, 'duration_minutes', parseInt(text) || 5)}
              keyboardType="numeric"
              placeholder="Min"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <View style={styles.taskActions}>
              <Pressable
                onPress={() => moveTask(index, 'up')}
                disabled={index === 0}
                style={styles.taskActionButton}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={index === 0 ? '#ccc' : theme.colors.text}
                />
              </Pressable>
              <Pressable
                onPress={() => moveTask(index, 'down')}
                disabled={index === tasks.length - 1}
                style={styles.taskActionButton}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={index === tasks.length - 1 ? '#ccc' : theme.colors.text}
                />
              </Pressable>
              <Pressable
                onPress={() => removeTask(index)}
                style={styles.taskActionButton}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isSubmitting ? 'Saving...' : 'Save Routine'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.saveButton}
        />
        <PrimaryButton
          title="Cancel"
          onPress={onCancel}
          style={[styles.cancelButton, { backgroundColor: '#666' }]}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  taskOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskOrderText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  durationInput: {
    width: 50,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 4,
  },
  taskActionButton: {
    padding: 4,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    width: '100%',
    marginBottom: 8,
  },
  cancelButton: {
    width: '100%',
  },
});