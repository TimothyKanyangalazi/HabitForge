import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../src/stores/routineStore';
import { RoutineCard } from '../../src/components/RoutineCard/RoutineCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { Routine } from '../../src/types';
import { 
  routineTemplates, 
  RoutineTemplate,
  getTemplateDuration,
  getTemplateTaskCount 
} from '../../src/templates/routineTemplates';

export default function RoutinesScreen() {
  const theme = useTheme();
  const { routines, fetchRoutines, deleteRoutine, archiveRoutine, createRoutine, addTask, isLoading } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchRoutines();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUseTemplate = (template: RoutineTemplate) => {
    Alert.alert(
      'Use Template',
      `Create "${template.name}" with ${getTemplateTaskCount(template)} tasks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              // Create routine
              const routineId = await createRoutine({
                name: template.name,
                description: template.description,
                icon: template.icon,
                color: template.color,
                start_time: template.start_time,
                days: JSON.stringify(template.days),
              });
              
              // Add tasks
              for (const task of template.tasks) {
                await addTask({
                  routine_id: routineId,
                  task_name: task.task_name,
                  order_index: task.order_index,
                  duration_minutes: task.duration_minutes,
                });
              }
              
              setIsSubmitting(false);
              setShowTemplates(false);
              Alert.alert(
                'Success',
                `"${template.name}" has been created!`,
                [
                  { 
                    text: 'View Routine', 
                    onPress: () => router.push(`/routine/${routineId}`)
                  },
                  { 
                    text: 'Stay Here', 
                    style: 'cancel' 
                  },
                ]
              );
            } catch (error) {
              console.error('Error creating routine from template:', error);
              setIsSubmitting(false);
              Alert.alert('Error', 'Failed to create routine from template.');
            }
          }
        }
      ]
    );
  };

  const renderRoutine = ({ item }: { item: Routine }) => (
    <RoutineCard
      routine={item}
      onPress={() => router.push(`/routine/${item.id}`)}
      onLongPress={() => showRoutineOptions(item)}
    />
  );

  const showRoutineOptions = (routine: Routine) => {
    Alert.alert(
      `Routine: ${routine.name}`,
      'Choose an action',
      [
        { 
          text: 'Edit', 
          onPress: () => router.push(`/routine/edit?id=${routine.id}`) 
        },
        { 
          text: 'Archive', 
          onPress: () => {
            Alert.alert(
              'Archive Routine',
              `Are you sure you want to archive "${routine.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Archive', 
                  onPress: async () => {
                    try {
                      await archiveRoutine(routine.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to archive routine.');
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
              'Delete Routine',
              `Are you sure you want to delete "${routine.name}"? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteRoutine(routine.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete routine.');
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
  const categories = ['All', ...new Set(routineTemplates.map(t => {
    const name = t.name.toLowerCase();
    if (name.includes('morning')) return 'Morning';
    if (name.includes('night')) return 'Night';
    if (name.includes('study') || name.includes('exam')) return 'Study';
    if (name.includes('fitness')) return 'Fitness';
    if (name.includes('code') || name.includes('productive')) return 'Productivity';
    if (name.includes('creative') || name.includes('music')) return 'Creative';
    return 'General';
  }))];

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'All'
    ? routineTemplates
    : routineTemplates.filter(t => {
        const name = t.name.toLowerCase();
        if (selectedCategory === 'Morning' && name.includes('morning')) return true;
        if (selectedCategory === 'Night' && name.includes('night')) return true;
        if (selectedCategory === 'Study' && (name.includes('study') || name.includes('exam'))) return true;
        if (selectedCategory === 'Fitness' && name.includes('fitness')) return true;
        if (selectedCategory === 'Productivity' && (name.includes('code') || name.includes('productive'))) return true;
        if (selectedCategory === 'Creative' && (name.includes('creative') || name.includes('music'))) return true;
        return false;
      });

  const renderTemplateItem = ({ item }: { item: RoutineTemplate }) => {
    const totalDuration = getTemplateDuration(item);
    const taskCount = getTemplateTaskCount(item);
    
    return (
      <Pressable
        onPress={() => handleUseTemplate(item)}
        style={[styles.templateCard, { 
          backgroundColor: theme.colors.card,
          borderLeftColor: item.color,
        }]}
      >
        <View style={styles.templateHeader}>
          <View style={[styles.templateIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon as any} size={24} color="#fff" />
          </View>
          <View style={styles.templateInfo}>
            <Text style={[styles.templateName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.templateDescription, { color: theme.colors.textSecondary }]}>
              {item.description}
            </Text>
          </View>
          <Pressable
            onPress={() => handleUseTemplate(item)}
            style={[styles.addTemplateButton, { backgroundColor: item.color }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.templateStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {item.start_time}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="list-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {taskCount} tasks
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="hourglass-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
              {totalDuration} min
            </Text>
          </View>
        </View>

        <View style={styles.taskPreview}>
          {item.tasks.slice(0, 3).map((task, index) => (
            <View key={index} style={styles.taskPreviewItem}>
              <Text style={[styles.taskPreviewText, { color: theme.colors.textSecondary }]}>
                {index + 1}. {task.task_name}
              </Text>
            </View>
          ))}
          {item.tasks.length > 3 && (
            <Text style={[styles.moreTasks, { color: theme.colors.primary }]}>
              +{item.tasks.length - 3} more tasks
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>My Routines</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTemplates(true)}
            style={[styles.templateButton, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="albums-outline" size={20} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/routine/create')}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Routine List */}
      <FlatList
        data={routines}
        renderItem={renderRoutine}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          routines.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="list-outline" size={48} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No Routines Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Create your own routine or start with a template
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/routine/create')}
                style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Create Routine</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTemplates(true)}
                style={[styles.emptyButton, { 
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                }]}
              >
                <Ionicons name="albums-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.emptyButtonText, { color: theme.colors.primary }]}>
                  Browse Templates
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListHeaderComponent={
          routines.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: theme.colors.textSecondary }]}>
                Your Routines
              </Text>
            </View>
          ) : null
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
            <View>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Routine Templates
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                Choose a pre-built routine
              </Text>
            </View>
            <Pressable
              onPress={() => setShowTemplates(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
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
                    style={[
                      styles.categoryText,
                      {
                        color: selectedCategory === category
                          ? '#fff'
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredTemplates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.templateList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="albums-outline" size={48} color={theme.colors.textSecondary} />
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 14,
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
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templateList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  templateCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 13,
  },
  addTemplateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  templateStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  taskPreview: {
    marginBottom: 4,
  },
  taskPreviewItem: {
    marginBottom: 4,
  },
  taskPreviewText: {
    fontSize: 13,
  },
  moreTasks: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});