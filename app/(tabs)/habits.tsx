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
import { useHabitStore } from '../../src/stores/habitStore';
import { HabitCard } from '../../src/components/HabitCard/HabitCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { Habit } from '../../src/types';
import { habitTemplates, HabitTemplate } from '../../src/templates/habitTemplates';

export default function HabitsScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { habits, todayLogs, fetchHabits, fetchTodayLogs, logHabit, archiveHabit, deleteHabit, createHabit } = useHabitStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const habitAnimations = useRef(habits.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    loadData();
    animateIn();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Animate habits when they load
    Animated.stagger(50,
      habits.map((_, index) => 
        Animated.spring(habitAnimations[index] || new Animated.Value(0), {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [habits.length]);

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

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    await Promise.all([fetchHabits(), fetchTodayLogs(today)]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Function to get the time slot for a habit based on the current time
  const getTimeSlot = (habit: Habit): { slot: string, priority: number } => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeValue = currentHour * 60 + currentMinutes;
    
    // Default habit time (if not specified in habit metadata)
    const habitTime = habit.reminder_time || habit.preferred_time || '09:00'; // Default to 9 AM
    
    if (habitTime) {
      const [hours, minutes] = habitTime.split(':').map(Number);
      const habitTimeValue = hours * 60 + minutes;
      
      // Determine time slot based on habit time
      if (habitTimeValue < 5 * 60) { // Before 5 AM
        return { slot: 'Early Morning', priority: 1 };
      } else if (habitTimeValue < 12 * 60) { // 5 AM - 12 PM
        return { slot: 'Morning', priority: 2 };
      } else if (habitTimeValue < 17 * 60) { // 12 PM - 5 PM
        return { slot: 'Afternoon', priority: 3 };
      } else if (habitTimeValue < 21 * 60) { // 5 PM - 9 PM
        return { slot: 'Evening', priority: 4 };
      } else { // After 9 PM
        return { slot: 'Night', priority: 5 };
      }
    }
    
    return { slot: 'Anytime', priority: 6 };
  };

  // Function to check if a habit is due now
  const isHabitDueNow = (habit: Habit): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeValue = currentHour * 60 + currentMinutes;
    
    const habitTime = habit.reminder_time || habit.preferred_time || '09:00';
    const [hours, minutes] = habitTime.split(':').map(Number);
    const habitTimeValue = hours * 60 + minutes;
    
    // Consider habit due if within 30 minutes of scheduled time
    const timeDiff = Math.abs(habitTimeValue - currentTimeValue);
    return timeDiff <= 30;
  };

  // Sort habits based on time of day
  const getSortedHabits = (): Habit[] => {
    return [...habits].sort((a, b) => {
      const timeA = a.reminder_time || a.preferred_time || '09:00';
      const timeB = b.reminder_time || b.preferred_time || '09:00';
      
      const [hoursA, minutesA] = timeA.split(':').map(Number);
      const [hoursB, minutesB] = timeB.split(':').map(Number);
      
      const timeValueA = hoursA * 60 + minutesA;
      const timeValueB = hoursB * 60 + minutesB;
      
      // Sort by time value
      return timeValueA - timeValueB;
    });
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

      if (newStatus === 'missed') {
        Alert.alert(
          'Log Excuse',
          'Would you like to log what stopped you?',
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Log Excuse', 
              onPress: () => router.push({
                pathname: '/excuses/create',
                params: { habitId: habit.id, habitName: habit.name }
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
                reminder_time: template.reminder_time || '09:00', // Default time from template
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

  const renderHabit = ({ item, index }: { item: Habit; index: number }) => {
    const anim = habitAnimations[index] || new Animated.Value(1);
    const timeSlot = getTimeSlot(item);
    const isDueNow = isHabitDueNow(item);
    const habitTime = item.reminder_time || item.preferred_time || '09:00';
    
    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        }}
      >
        <View style={styles.habitWrapper}>
          {isDueNow && (
            <View style={[styles.dueNowBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="time" size={12} color="#fff" />
              <Text style={styles.dueNowText}>Due Now</Text>
            </View>
          )}
          <HabitCard
            habit={item}
            log={todayLogs[item.id]}
            onPress={() => router.push(`/habit/${item.id}`)}
            onComplete={() => handleCompleteHabit(item)}
            onLongPress={() => showHabitOptions(item)}
          />
          <View style={styles.timeIndicator}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {habitTime} • {timeSlot.slot}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const showHabitOptions = (habit: Habit) => {
    Alert.alert(
      `Habit: ${habit.name}`,
      'Choose an action',
      [
        { text: 'Edit', onPress: () => router.push(`/habit/edit?id=${habit.id}`) },
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

  const categories = ['All', ...new Set(habitTemplates.map(t => t.category))];
  const filteredTemplates = selectedCategory === 'All' 
    ? habitTemplates 
    : habitTemplates.filter(t => t.category === selectedCategory);

  const renderTemplateItem = ({ item }: { item: HabitTemplate }) => (
    <Pressable
      onPress={() => handleUseTemplate(item)}
      style={({ pressed }) => [
        styles.templateItem,
        { 
          backgroundColor: colors.card,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '10']}
        style={styles.templateIcon}
      >
        <Ionicons name={item.icon as any} size={24} color={colors.primary} />
      </LinearGradient>
      <View style={styles.templateContent}>
        <Text style={[styles.templateName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
        <View style={styles.templateMeta}>
          <View style={[styles.templateCategoryBadge, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.templateCategory, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
          <Text style={[styles.templateFrequency, { color: colors.textSecondary }]}>
            {item.frequency_type} • {item.target_count}x • {item.reminder_time || '09:00'}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => handleUseTemplate(item)}
        style={({ pressed }) => [
          styles.addTemplateButton,
          { 
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </Pressable>
    </Pressable>
  );

  const completedCount = habits.filter(h => todayLogs[h.id]?.status === 'completed').length;
  const sortedHabits = getSortedHabits();
  const currentTimeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Habits</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completedCount} of {habits.length} completed today
          </Text>
          <View style={styles.currentTimeContainer}>
            <Ionicons name="time" size={14} color={colors.primary} />
            <Text style={[styles.currentTimeText, { color: colors.primary }]}>
              {currentTimeString}
            </Text>
          </View>
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
            onPress={() => router.push('/habit/create')}
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

      <FlatList
        data={sortedHabits}
        renderItem={renderHabit}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
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
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No Habits Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create a habit or use a template to get started
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/habit/create')}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.emptyButton}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Create Habit</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => setShowTemplates(true)}
                style={({ pressed }) => [
                  styles.emptyButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderWidth: 1,
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
      />

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Habit Templates
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose a pre-built habit to get started
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
                  style={{
                    color: selectedCategory === category ? '#fff' : colors.text,
                    fontWeight: '600',
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
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  currentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  currentTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },
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
  listContent: { paddingBottom: 100 },
  habitWrapper: {
    position: 'relative',
  },
  dueNowBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dueNowText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyActions: { flexDirection: 'row', gap: 12 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
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
  templateList: { paddingHorizontal: 20, paddingBottom: 20 },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateContent: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  templateDescription: { fontSize: 13, marginBottom: 8 },
  templateMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  templateCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  templateCategory: { fontSize: 11, fontWeight: '600' },
  templateFrequency: { fontSize: 11 },
  addTemplateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});