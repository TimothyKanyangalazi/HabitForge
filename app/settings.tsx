import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Switch,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useSettingsStore } from '../src/stores/settingsStore';
import { lightTheme } from '../src/theme';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
   const themeContext = useTheme();
  
  const colors = theme.colors || lightTheme.colors;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
            Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            APPEARANCE
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            {/* Dark Mode Toggle */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: '#9C27B0' + '15' }]}>
                <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={22} color="#9C27B0" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Switch between light and dark theme
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: '#9C27B0' + '80' }}
                thumbColor={isDark ? '#9C27B0' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            NOTIFICATIONS
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Pressable
              onPress={() => router.push('/notifications-settings')}
              style={({ pressed }) => [
                styles.settingItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Notification Settings
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Manage reminders and alerts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            DATA
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Pressable
              onPress={() => router.push('/data-management')}
              style={({ pressed }) => [
                styles.settingItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.success + '15' }]}>
                <Ionicons name="server-outline" size={22} color={theme.colors.success} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Data Management
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Export, import, or reset data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            ABOUT
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Ionicons name="information-circle-outline" size={22} color={theme.colors.warning} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Version
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  HabitForge v1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>

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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
});