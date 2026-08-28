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
import { useAchievementStore } from '../src/stores/achievementStore';
import { AchievementCard } from '../src/components/AchievementCard';
import { Achievement } from '../src/types';

export default function AchievementsScreen() {
  const theme = useTheme();
  const { 
    achievements, 
    userAchievements, 
    unlockedIds,
    totalXp,
    userLevel,
    fetchAchievements,
    checkAndUnlock,
    isLoading,
  } = useAchievementStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  
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
    await fetchAchievements();
    const newlyUnlockedAchievements = await checkAndUnlock();
    if (newlyUnlockedAchievements.length > 0) {
      setNewlyUnlocked(newlyUnlockedAchievements);
      setTimeout(() => setNewlyUnlocked([]), 3000);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const unlockedCount = unlockedIds.size;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

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
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Achievements
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Track your progress and earn rewards
          </Text>
        </View>

        {/* Level Card */}
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelInfo}>
            <View style={styles.levelIcon}>
              <Ionicons name="trophy" size={32} color="#fff" />
            </View>
            <View style={styles.levelContent}>
              <Text style={styles.levelTitle}>Level {userLevel}</Text>
              <Text style={styles.levelSubtitle}>{totalXp} Total XP</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Achievement Progress</Text>
              <Text style={styles.progressPercent}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Newly Unlocked Notification */}
        {newlyUnlocked.length > 0 && (
          <View style={[styles.notificationCard, { backgroundColor: theme.colors.success + '15' }]}>
            <Ionicons name="sparkles" size={24} color={theme.colors.success} />
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: theme.colors.success }]}>
                Achievement Unlocked!
              </Text>
              <Text style={[styles.notificationText, { color: theme.colors.text }]}>
                {newlyUnlocked.map(a => a.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Achievements Grid */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            All Achievements
          </Text>
          
          {achievements.map((achievement, index) => (
            <Animated.View
              key={achievement.id}
              style={{
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 20],
                      outputRange: [0, 20 + index * 5],
                    }) 
                  },
                ],
              }}
            >
              <AchievementCard
                achievement={achievement}
                unlocked={unlockedIds.has(achievement.id)}
                unlockedAt={userAchievements.find(ua => ua.id === achievement.id)?.unlocked_at}
              />
            </Animated.View>
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  levelCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  levelSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationText: {
    fontSize: 13,
  },
  achievementsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});