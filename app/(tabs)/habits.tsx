import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../../src/stores/habitStore';
import { HabitCard } from '../../src/components/HabitCard/HabitCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { Habit } from '../../src/types';
import { habitTemplates, HabitTemplate } from '../../src/templates/habitTemplates';

export default function HabitsScreen() {
  const theme = useTheme();
  const { habits, todayLogs, fetchHabits, fetchTodayLogs, logHabit, archiveHabit, deleteHabit, createHabit } = useHabitStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([fetchHabits(), fetchTodayLogs(today)]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

const handleCompleteHabit = async (habit: Habit) => {
  const today = new Date().toISOString().split('T')[0];
  const currentLog = todayLogs[habit.id];
  
  let newStatus: 'completed' | 'missed' | 'skipped' = 'completed';
  if (currentLog?.status === 'completed') {
    newStatus = 'missed';
  }

  try {
    await logHabit({
      habit_id: habit.id,
      log_date: today,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });

    // If marking as missed, offer to log excuse
    if (newStatus === 'missed') {
      Alert.alert(
        'Log Excuse',
        'Would you like to log what stopped you?',
        [
          { 
            text: 'Not Now', 
            style: 'cancel' 
          },
          { 
            text: 'Log Excuse', 
            onPress: () => router.push({
              pathname: '/excuses/create',
              params: { 
                habitId: habit.id,
                habitName: habit.name 
              }
            })
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error logging habit:', error);
    Alert.alert('Error', 'Failed to update habit. Please try again.');
  }
};

  const handleUseTemplate = async (template: HabitTemplate) => {
    Alert.alert(
      'Add Template',
      `Add "${template.name}" to your habits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              await createHabit({
                name: template.name,
                description: template.description,
                icon: template.icon,
                frequency_type: template.frequency_type,
                target_count: template.target_count,
                start_date: new Date().toISOString().split('T')[0],
              });
              setShowTemplates(false);
              Alert.alert('Success', `"${template.name}" has been added!`);
            } catch (error) {
              console.error('Error adding template:', error);
              Alert.alert('Error', 'Failed to add template habit.');
            }
          }
        }
      ]
    );
  };

  const renderHabit = ({ item }: { item: Habit }) => (
    <HabitCard
      habit={item}
      log={todayLogs[item.id]}
      onPress={() => router.push(`/habit/${item.id}`)}
      onComplete={() => handleCompleteHabit(item)}
      onLongPress={() => showHabitOptions(item)}
    />
  );

  const showHabitOptions = (habit: Habit) => {
    Alert.alert(
      `Habit: ${habit.name}`,
      'Choose an action',
      [
        { 
          text: 'Edit', 
          onPress: () => router.push(`/habit/edit?id=${habit.id}`) 
        },
        { 
          text: 'Archive', 
          onPress: () => {
            Alert.alert(
              'Archive Habit',
              `Are you sure you want to archive "${habit.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Archive', 
                  onPress: async () => {
                    try {
                      await archiveHabit(habit.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to archive habit.');
                    }
                  }
                }
              ]
            );
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Habit',
              `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteHabit(habit.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete habit.');
                    }
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Get unique categories from templates
  const categories = ['All', ...new Set(habitTemplates.map(t => t.category))];
  
  // Filter templates by category
  const filteredTemplates = selectedCategory === 'All' 
    ? habitTemplates 
    : habitTemplates.filter(t => t.category === selectedCategory);

  const renderTemplateItem = ({ item }: { item: HabitTemplate }) => (
    <Pressable
      onPress={() => handleUseTemplate(item)}
      style={[styles.templateItem, { backgroundColor: theme.colors.card }]}
    >
      <View style={[styles.templateIcon, { backgroundColor: theme.colors.primary + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.templateContent}>
        <Text style={[styles.templateName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.templateDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
        <View style={styles.templateMeta}>
          <Text style={[styles.templateCategory, { color: theme.colors.primary }]}>
            {item.category}
          </Text>
          <Text style={[styles.templateFrequency, { color: theme.colors.textSecondary }]}>
            {item.frequency_type} • {item.target_count}x
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => handleUseTemplate(item)}
        style={[styles.addTemplateButton, { backgroundColor: theme.colors.primary }]}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>My Habits</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTemplates(true)}
            style={[styles.templateButton, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="albums-outline" size={20} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/habit/create')}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={habits}
        renderItem={renderHabit}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No habits yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Create a habit or use a template to get started
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/habit/create')}
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Create Habit</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTemplates(true)}
                style={[styles.emptyButton, { backgroundColor: theme.colors.card }]}
              >
                <Ionicons name="albums-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.emptyButtonText, { color: theme.colors.primary }]}>
                  Browse Templates
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Habit Templates
            </Text>
            <Pressable
              onPress={() => setShowTemplates(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map(category => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category 
                      ? theme.colors.primary 
                      : theme.colors.card,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selectedCategory === category 
                      ? '#fff' 
                      : theme.colors.text,
                    fontWeight: '500',
                  }}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={filteredTemplates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.templateList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No templates in this category
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  categoryContainer: {
    flexGrow: 0,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  templateList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  templateFrequency: {
    fontSize: 12,
  },
  addTemplateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});