import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Switch,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { lightTheme } from '../src/theme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function NotificationsSettingsScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { settings, updateSettings } = useSettingsStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  
  const isExpoGo = Constants.appOwnership === 'expo';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSettings({ notificationsEnabled: value });
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            Notifications
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Expo Go Info */}
        {isExpoGo ? (
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="information-circle" size={32} color={colors.warning} />
            </View>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Not Available in Expo Go
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Notifications require a development build. Build the APK to enable this feature.
            </Text>
            <View style={[styles.infoBadge, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="build" size={14} color={colors.primary} />
              <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
                Available in APK build
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.masterCard, { backgroundColor: colors.card }]}>
            <View style={[styles.masterIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </View>
            <View style={styles.masterContent}>
              <Text style={[styles.masterTitle, { color: colors.text }]}>
                Enable Notifications
              </Text>
              <Text style={[styles.masterSubtitle, { color: colors.textSecondary }]}>
                Receive reminders for your habits and routines
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800' },
  infoCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoTitle: { fontSize: 18, fontWeight: '700' },
  infoText: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  infoBadgeText: { fontSize: 12, fontWeight: '600' },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  masterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterContent: { flex: 1 },
  masterTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  masterSubtitle: { fontSize: 12 },
});