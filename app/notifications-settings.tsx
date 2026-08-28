import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Switch,
  Animated,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useNotificationStore } from '../src/stores/notificationStore';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function NotificationsSettingsScreen() {
  const theme = useTheme();
  const { 
    hasPermission,
    requestPermission,
    scheduleHabitReminder,
    scheduleRoutineReminder,
    scheduleDailyReview,
    scheduleMorningMotivation,
    cancelAll,
    getAllScheduled,
    scheduledNotifications,
  } = useNotificationStore();
  
  const { settings, updateSettings } = useSettingsStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [routineReminders, setRoutineReminders] = useState(true);
  const [dailyReview, setDailyReview] = useState(true);
  const [morningMotivation, setMorningMotivation] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadSettings = async () => {
    const hasPermission = await requestPermission();
    setNotificationsEnabled(hasPermission);
    
    // Load settings from store
    setHabitReminders(settings.notificationsEnabled ?? true);
    setRoutineReminders(settings.notificationsEnabled ?? true);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSettings({ notificationsEnabled: value });
    
    if (!value) {
      await cancelAll();
      Alert.alert('Notifications Disabled', 'All reminders have been cancelled.');
    } else {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        Alert.alert('Notifications Enabled', 'Reminders will be scheduled.');
      } else {
        setNotificationsEnabled(false);
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    }
  };

  const handleToggleHabitReminders = async (value: boolean) => {
    setHabitReminders(value);
    await updateSettings({ notificationsEnabled: value });
  };

  const handleToggleRoutineReminders = async (value: boolean) => {
    setRoutineReminders(value);
    await updateSettings({ notificationsEnabled: value });
  };

  const handleToggleDailyReview = async (value: boolean) => {
    setDailyReview(value);
    if (value) {
      await scheduleDailyReview('21:00');
    }
  };

  const handleToggleMorningMotivation = async (value: boolean) => {
    setMorningMotivation(value);
    if (value) {
      await scheduleMorningMotivation('08:00');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notifications
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Master Toggle */}
        <View style={[styles.masterCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.masterIcon}>
            <Ionicons name="notifications" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.masterContent}>
            <Text style={[styles.masterTitle, { color: theme.colors.text }]}>
              Enable Notifications
            </Text>
            <Text style={[styles.masterSubtitle, { color: theme.colors.textSecondary }]}>
              Receive reminders for your habits and routines
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
            thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
          />
        </View>

        {/* Notification Types */}
        {notificationsEnabled && (
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Reminder Types
            </Text>
            
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
              {/* Habit Reminders */}
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    Habit Reminders
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    Get reminded to complete your habits
                  </Text>
                </View>
                <Switch
                  value={habitReminders}
                  onValueChange={handleToggleHabitReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
                  thumbColor={habitReminders ? theme.colors.primary : '#f4f3f4'}
                />
              </View>

              {/* Routine Reminders */}
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: theme.colors.success + '15' }]}>
                  <Ionicons name="list" size={20} color={theme.colors.success} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    Routine Reminders
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    Get reminded to start your routines
                  </Text>
                </View>
                <Switch
                  value={routineReminders}
                  onValueChange={handleToggleRoutineReminders}
                  trackColor={{ false: theme.colors.border, true: theme.colors.success + '80' }}
                  thumbColor={routineReminders ? theme.colors.success : '#f4f3f4'}
                />
              </View>

              {/* Morning Motivation */}
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                  <Ionicons name="sunny" size={20} color={theme.colors.warning} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    Morning Motivation
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    Start your day with a motivational message
                  </Text>
                </View>
                <Switch
                  value={morningMotivation}
                  onValueChange={handleToggleMorningMotivation}
                  trackColor={{ false: theme.colors.border, true: theme.colors.warning + '80' }}
                  thumbColor={morningMotivation ? theme.colors.warning : '#f4f3f4'}
                />
              </View>

              {/* Daily Review */}
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: '#9C27B0' + '15' }]}>
                  <Ionicons name="moon" size={20} color="#9C27B0" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    Daily Review
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    Review your day and plan for tomorrow
                  </Text>
                </View>
                <Switch
                  value={dailyReview}
                  onValueChange={handleToggleDailyReview}
                  trackColor={{ false: theme.colors.border, true: '#9C27B0' + '80' }}
                  thumbColor={dailyReview ? '#9C27B0' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>
        )}

        {/* Scheduled Notifications */}
        {notificationsEnabled && scheduledNotifications.length > 0 && (
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Scheduled Reminders
            </Text>
            
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
              {scheduledNotifications.map((notification, index) => (
                <View key={index} style={styles.scheduledItem}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <View style={styles.scheduledContent}>
                    <Text style={[styles.scheduledTitle, { color: theme.colors.text }]}>
                      {notification.content?.title || 'Reminder'}
                    </Text>
                    <Text style={[styles.scheduledSubtitle, { color: theme.colors.textSecondary }]}>
                      {notification.content?.body || ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
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
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  masterContent: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  masterSubtitle: {
    fontSize: 12,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  scheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  scheduledContent: {
    flex: 1,
  },
  scheduledTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduledSubtitle: {
    fontSize: 12,
  },
});