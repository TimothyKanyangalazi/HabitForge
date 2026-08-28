import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { PrimaryButton } from '../common/PrimaryButton';
import { Habit } from '../../types';

interface HabitFormProps {
  initialValues?: Partial<Habit>;
  onSubmit: (values: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const FREQUENCIES = [
  { label: 'Daily', value: 'daily', icon: 'calendar' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' },
  { label: 'Custom', value: 'custom', icon: 'settings-outline' },
];

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const ICONS = [
  'fitness', 'book', 'water', 'meditate', 'journal', 'code', 
  'musical-notes', 'walk', 'bed', 'restaurant', 'briefcase', 'school'
];

export const HabitForm: React.FC<HabitFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [frequency, setFrequency] = useState(initialValues?.frequency_type || 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialValues?.selected_days ? JSON.parse(initialValues.selected_days) : []
  );
  const [reminderTime, setReminderTime] = useState(initialValues?.reminder_time || '');
  const [targetCount, setTargetCount] = useState(String(initialValues?.target_count || 1));
  const [icon, setIcon] = useState(initialValues?.icon || 'fitness');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency_type: frequency as 'daily' | 'weekly' | 'custom',
        selected_days: selectedDays.length > 0 ? JSON.stringify(selectedDays) : undefined,
        reminder_time: reminderTime || undefined,
        target_count: parseInt(targetCount) || 1,
        icon,
        start_date: new Date().toISOString().split('T')[0],
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
        <Text style={[styles.label, { color: theme.colors.text }]}>Habit Name</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Read 20 pages"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Why do you want to build this habit?"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          {FREQUENCIES.map(freq => (
            <Pressable
              key={freq.value}
              onPress={() => setFrequency(freq.value)}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: frequency === freq.value ? theme.colors.primary : '#f5f5f5',
                },
              ]}
            >
              <Ionicons
                name={freq.icon as any}
                size={20}
                color={frequency === freq.value ? '#fff' : theme.colors.text}
              />
              <Text
                style={[
                  styles.frequencyText,
                  { color: frequency === freq.value ? '#fff' : theme.colors.text },
                ]}
              >
                {freq.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {frequency !== 'daily' && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Select Days</Text>
          <View style={styles.daysContainer}>
            {DAYS.map(day => (
              <Pressable
                key={day.value}
                onPress={() => toggleDay(day.value)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: selectedDays.includes(day.value)
                      ? theme.colors.primary
                      : '#f5f5f5',
                  },
                ]}
              >
                <Text
                  style={{
                    color: selectedDays.includes(day.value) ? '#fff' : theme.colors.text,
                  }}
                >
                  {day.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Reminder Time (Optional)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="08:00"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Daily Target</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          value={targetCount}
          onChangeText={setTargetCount}
          keyboardType="numeric"
          placeholder="1"
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
                  backgroundColor: icon === iconName ? theme.colors.primary : '#f5f5f5',
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

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isSubmitting ? 'Saving...' : 'Save Habit'}
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
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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