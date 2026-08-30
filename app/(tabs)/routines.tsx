import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  RefreshControl, 
  Alert, 
  Modal, 
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoutineStore } from '../../src/stores/routineStore';
import { RoutineCard } from '../../src/components/RoutineCard/RoutineCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { Routine } from '../../src/types';
import { lightTheme } from '../../src/theme';
import { 
  routineTemplates, 
  RoutineTemplate,
  getTemplateDuration,
  getTemplateTaskCount 
} from '../../src/templates/routineTemplates';

export default function RoutinesScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { routines, fetchRoutines, deleteRoutine, archiveRoutine, createRoutine, addTask, isLoading } = useRoutineStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const templateAnimations = useRef(routineTemplates.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadData();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (showTemplates) {
      Animated.stagger(50,
        templateAnimations.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      templateAnimations.forEach(anim => anim.setValue(0));
    }
  }, [showTemplates]);

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
              
              const routineId = await createRoutine({
                name: template.name,
                description: template.description,
                icon: template.icon,
                color: template.color,
                start_time: template.start_time,
                days: JSON.stringify(template.days),
              });
              
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
                  { text: 'View Routine', onPress: () => router.push(`/routine/${routineId}`) },
                  { text: 'Stay Here', style: 'cancel' },
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

  const renderRoutine = ({ item, index }: { item: Routine; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 20],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <RoutineCard
        routine={item}
        onPress={() => router.push(`/routine/${item.id}`)}
        onLongPress={() => showRoutineOptions(item)}
      />
    </Animated.View>
  );

  const showRoutineOptions = (routine: Routine) => {
    Alert.alert(
      `Routine: ${routine.name}`,
      'Choose an action',
      [
        { text: 'Edit', onPress: () => router.push(`/routine/edit?id=${routine.id}`) },
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

  const renderTemplateItem = ({ item, index }: { item: RoutineTemplate; index: number }) => {
    const totalDuration = getTemplateDuration(item);
    const taskCount = getTemplateTaskCount(item);
    const anim = templateAnimations[index] || new Animated.Value(1);
    
    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={() => handleUseTemplate(item)}
          style={({ pressed }) => [
            styles.templateCard,
            { 
              backgroundColor: colors.card,
              borderLeftColor: item.color,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={styles.templateHeader}>
            <View style={[styles.templateIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.templateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <Pressable
              onPress={() => handleUseTemplate(item)}
              style={({ pressed }) => [
                styles.addTemplateButton,
                { 
                  backgroundColor: item.color,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.templateStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {item.start_time}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {taskCount} tasks
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="hourglass-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {totalDuration} min
              </Text>
            </View>
          </View>

          <View style={styles.taskPreview}>
            {item.tasks.slice(0, 3).map((task, taskIndex) => (
              <View key={taskIndex} style={styles.taskPreviewItem}>
                <Ionicons name="checkmark" size={12} color={item.color} />
                <Text style={[styles.taskPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {task.task_name}
                </Text>
              </View>
            ))}
            {item.tasks.length > 3 && (
              <Text style={[styles.moreTasks, { color: item.color }]}>
                +{item.tasks.length - 3} more tasks
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              { 
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }) 
              },
            ],
          },
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>My Routines</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowTemplates(true)}
            style={({ pressed }) => [
              styles.templateButton,
              { 
                backgroundColor: colors.card,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <Ionicons name="albums-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/routine/create')}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No Routines Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your own routine or start with a template
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/routine/create')}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.emptyButton}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Create Routine</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => setShowTemplates(true)}
                style={({ pressed }) => [
                  styles.emptyButton,
                  { 
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Ionicons name="albums-outline" size={20} color={colors.primary} />
                <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
                  Browse Templates
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListHeaderComponent={
          routines.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: colors.textSecondary }]}>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Routine Templates
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose a pre-built routine to get started
              </Text>
            </View>
            <Pressable
              onPress={() => setShowTemplates(false)}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {categories.map(category => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category
                      ? colors.primary
                      : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selectedCategory === category ? '#fff' : colors.text,
                      fontWeight: '600',
                      fontSize: 13,
                    },
                  ]}
                  numberOfLines={1}
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
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="albums-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
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
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  listHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: { paddingBottom: 100 },
  emptyListContent: { flexGrow: 1 },
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
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalHeaderText: { flex: 1, paddingRight: 12 },
  modalTitle: { fontSize: 28, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, marginTop: 4 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContainer: { flexGrow: 0, marginBottom: 16 },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: { fontSize: 14, fontWeight: '500' },
  templateList: { paddingHorizontal: 20, paddingBottom: 40 },
  templateCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
  templateInfo: { flex: 1, minWidth: 0 },
  templateName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  templateDescription: { fontSize: 13, lineHeight: 18 },
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
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  taskPreview: { marginBottom: 4 },
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taskPreviewText: { fontSize: 13, flex: 1 },
  moreTasks: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});