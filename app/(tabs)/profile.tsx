import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated,
  Dimensions,
  Alert,
  Switch,
  Easing,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeContext';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useRoutineStore } from '../../src/stores/routineStore';
import { statisticsService } from '../../src/services/statisticsService';
import { lightTheme } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const { settings = {}, loadSettings, updateSettings } = useSettingsStore();
  const { habits = [] } = useHabitStore();
  const { routines = [] } = useRoutineStore();
  
  const [totalHabitsCompleted, setTotalHabitsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const notificationsEnabled = settings.notificationsEnabled ?? true;
  const currentTheme = settings.theme ?? 'light';
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfileData();
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
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

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [streak, totalCompleted, longest, rate] = await Promise.all([
        statisticsService.getCurrentStreak(),
        statisticsService.getTotalHabitsCompleted(),
        statisticsService.getLongestStreak(),
        statisticsService.getOverallCompletionRate(),
      ]);
      
      setCurrentStreak(streak || 0);
      setTotalHabitsCompleted(totalCompleted || 0);
      setLongestStreak(longest || 0);
      setCompletionRate(rate || 0);
      
      const level = Math.floor((totalCompleted || 0) / 10) + 1;
      const xp = ((totalCompleted || 0) % 10) * 10;
      setUserLevel(level);
      setUserXp(xp);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    try {
      if (key === 'theme') {
        await updateSettings({ theme: value ? 'dark' : 'light' });
      } else if (key === 'notifications_enabled') {
        await updateSettings({ notificationsEnabled: value });
      }
    } catch (error) {
      console.error('Error toggling setting:', error);
    }
  };

  const menuSections = [
    {
      title: 'Tracking',
      items: [
        {
          icon: 'checkmark-circle-outline',
          title: 'My Habits',
          subtitle: `${habits.length || 0} active habits`,
          route: '/habits',
          color: colors.primary,
        },
        {
          icon: 'list-outline',
          title: 'My Routines',
          subtitle: `${routines.length || 0} active routines`,
          route: '/routines',
          color: colors.success,
        },
        {
          icon: 'alert-circle-outline',
          title: 'Excuse Log',
          subtitle: 'View your excuse history',
          route: '/excuses',
          color: colors.danger,
        },
        {
          icon: 'stats-chart-outline',
          title: 'Statistics',
          subtitle: 'Detailed analytics',
          route: '/statistics',
          color: colors.warning,
        },
      ],
    },
    {
      title: 'Achievements',
      items: [
        {
          icon: 'trophy-outline',
          title: 'Achievements',
          subtitle: 'Track your progress',
          route: '/achievements',
          color: '#F4A340',
        },
        {
          icon: 'flame-outline',
          title: 'My Streak',
          subtitle: `${currentStreak} day streak`,
          route: '/streaks',
          color: '#FF6B6B',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Manage reminders',
          route: '/notifications-settings',
          color: colors.primary,
        },
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Switch theme',
          color: '#9C27B0',
          isToggle: true,
          toggleKey: 'theme',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: 'server-outline',
          title: 'Data Management',
          subtitle: 'Export, import, or reset data',
          route: '/data-management',
          color: colors.primary,
        },
      ],
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        {/* Profile Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              { 
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }) 
              },
            ],
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <View style={styles.profileHeaderContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Image 
                    source={require('../../assets/HF3.png')} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv {userLevel}</Text>
                </View>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>HabitForge</Text>
                <Text style={styles.profileSubtitle}>Building better habits daily</Text>
                
                <View style={styles.xpContainer}>
                  <View style={styles.xpBar}>
                    <View style={[styles.xpFill, { width: `${userXp}%` }]} />
                  </View>
                  <Text style={styles.xpText}>{userXp}/100 XP</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalHabitsCompleted}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completionRate.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Success</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
                {section.title.toUpperCase()}
              </Text>
              
              <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={itemIndex}
                    onPress={item.onPress || (() => item.route && router.push(item.route))}
                    style={({ pressed }) => [
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && styles.menuItemBorder,
                      { 
                        opacity: pressed ? 0.7 : 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    
                    <View style={styles.menuItemContent}>
                      <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    
                    {item.isToggle ? (
                      <Switch
                        value={
                          item.toggleKey === 'theme' 
                            ? currentTheme === 'dark'
                            : notificationsEnabled
                        }
                        onValueChange={(value) => handleToggle(item.toggleKey!, value)}
                        trackColor={{ 
                          false: colors.border, 
                          true: item.color + '80',
                        }}
                        thumbColor={
                          item.toggleKey === 'theme'
                            ? currentTheme === 'dark' ? '#9C27B0' : '#f4f3f4'
                            : notificationsEnabled ? item.color : '#f4f3f4'
                        }
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            HabitForge v1.0.0
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuContainer: { paddingHorizontal: 20 },
  menuSection: { marginBottom: 20 },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: { flex: 1 },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: { fontSize: 12 },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: { fontSize: 12 },
});