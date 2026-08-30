import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/theme/ThemeContext';
import { statisticsService } from '../src/services/statisticsService';
import { useHabitStore } from '../src/stores/habitStore';
import { useRoutineStore } from '../src/stores/routineStore';
import { lightTheme } from '../src/theme';

export default function StreaksScreen() {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const { habits } = useHabitStore();
  const { routines } = useRoutineStore();
  
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [habitStreaks, setHabitStreaks] = useState<any[]>([]);
  const [routineStreaks, setRoutineStreaks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadData();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [current, longest, habitStreakData, routineStreakData] = await Promise.all([
        statisticsService.getCurrentStreak(),
        statisticsService.getLongestStreak(),
        statisticsService.getHabitStreaks(),
        statisticsService.getRoutineStreaks(),
      ]);
      
      setCurrentStreak(current || 0);
      setLongestStreak(longest || 0);
      setHabitStreaks(habitStreakData || []);
      setRoutineStreaks(routineStreakData || []);
    } catch (error) {
      console.error('Error loading streaks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Streaks
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Streak Cards */}
        <View style={styles.mainStreakContainer}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStreakCard}
          >
            <View style={styles.flameIcon}>
              <Ionicons name="flame" size={40} color="#fff" />
            </View>
            <Text style={styles.mainStreakValue}>{currentStreak}</Text>
            <Text style={styles.mainStreakLabel}>Current Streak</Text>
            <Text style={styles.mainStreakSubtext}>Days in a row</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStreakCard}
          >
            <View style={styles.trophyIcon}>
              <Ionicons name="trophy" size={40} color="#fff" />
            </View>
            <Text style={styles.mainStreakValue}>{longestStreak}</Text>
            <Text style={styles.mainStreakLabel}>Longest Streak</Text>
            <Text style={styles.mainStreakSubtext}>Personal best</Text>
          </LinearGradient>
        </View>

        {/* Streak Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Streak Achievements
          </Text>
          
          <View style={styles.achievementList}>
            {[
              { days: 7, icon: 'flame', label: '7 Day Streak', color: '#FF6B6B', achieved: longestStreak >= 7 },
              { days: 14, icon: 'flame', label: '14 Day Streak', color: '#FF8E53', achieved: longestStreak >= 14 },
              { days: 30, icon: 'trophy', label: '30 Day Streak', color: '#FFD700', achieved: longestStreak >= 30 },
              { days: 60, icon: 'trophy', label: '60 Day Streak', color: '#FFA500', achieved: longestStreak >= 60 },
              { days: 100, icon: 'diamond', label: '100 Day Streak', color: '#9C27B0', achieved: longestStreak >= 100 },
              { days: 365, icon: 'crown', label: '365 Day Streak', color: '#FFD700', achieved: longestStreak >= 365 },
            ].map((achievement) => (
              <View 
                key={achievement.days} 
                style={[
                  styles.achievementItem,
                  { 
                    backgroundColor: theme.colors.card,
                    opacity: achievement.achieved ? 1 : 0.5,
                  },
                ]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                  <Ionicons 
                    name={achievement.achieved ? achievement.icon : 'lock-closed'} 
                    size={24} 
                    color={achievement.achieved ? achievement.color : theme.colors.textSecondary} 
                  />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementLabel, { color: theme.colors.text }]}>
                    {achievement.label}
                  </Text>
                  <Text style={[styles.achievementSubtext, { color: theme.colors.textSecondary }]}>
                    {achievement.achieved ? 'Achieved!' : `${achievement.days - longestStreak} days to go`}
                  </Text>
                </View>
                {achievement.achieved && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Per-Habit Streaks */}
        {habitStreaks.length > 0 && (
          <View style={styles.habitStreaksSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Habit Streaks
            </Text>
            
            {habitStreaks.map((habit, index) => (
              <View key={index} style={[styles.habitStreakItem, { backgroundColor: theme.colors.card }]}>
                <View style={[styles.habitIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name={habit.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.habitContent}>
                  <Text style={[styles.habitName, { color: theme.colors.text }]}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.habitStreakText, { color: theme.colors.textSecondary }]}>
                    {habit.current_streak || 0} day streak
                  </Text>
                </View>
                <View style={[styles.habitStreakBadge, { backgroundColor: '#FF6B6B' + '20' }]}>
                  <Ionicons name="flame" size={16} color="#FF6B6B" />
                  <Text style={[styles.habitStreakCount, { color: '#FF6B6B' }]}>
                    {habit.current_streak || 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Routine Streaks */}
        {routineStreaks.length > 0 && (
          <View style={styles.routineStreaksSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Routine Streaks
            </Text>
            
            {routineStreaks.map((routine, index) => (
              <View key={index} style={[styles.routineStreakItem, { backgroundColor: routine.color || theme.colors.primary }]}>
                <View style={styles.routineIcon}>
                  <Ionicons name={routine.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>
                    {routine.name}
                  </Text>
                  <Text style={styles.routineStreakText}>
                    {routine.current_streak || 0} day streak
                  </Text>
                </View>
                <View style={styles.routineStreakBadge}>
                  <Ionicons name="flame" size={16} color="#fff" />
                  <Text style={styles.routineStreakCount}>
                    {routine.current_streak || 0}
                  </Text>
                </View>
              </View>
            ))}
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
  mainStreakContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  mainStreakCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  flameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trophyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainStreakValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainStreakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  mainStreakSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementList: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementSubtext: {
    fontSize: 12,
  },
  habitStreaksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  habitStreakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitContent: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitStreakText: {
    fontSize: 12,
  },
  habitStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  habitStreakCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  routineStreaksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  routineStreakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  routineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineContent: {
    flex: 1,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  routineStreakText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  routineStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 4,
  },
  routineStreakCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});