import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated, 
  Dimensions,
  RefreshControl,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { lightTheme } from '../../src/theme';
import { statisticsService } from '../../src/services/statisticsService';
import { BarChart } from '../../src/components/Charts/BarChart';
import { CalendarHeatmap } from '../../src/components/Charts/CalendarHeatmap';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type TabType = 'daily' | 'weekly' | 'monthly';

export default function StatisticsScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, completed: 0, missed: 0 });
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [habitTrends, setHabitTrends] = useState<any[]>([]);
  const [excusePatterns, setExcusePatterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [weekly, monthly, heatmap, trends, excuses] = await Promise.all([
        statisticsService.getWeeklyStats(),
        statisticsService.getMonthlyStats(),
        statisticsService.getHeatmapData(30),
        statisticsService.getHabitTrends(),
        statisticsService.getExcusePatterns(),
      ]);
      
      setWeeklyData(weekly || []);
      setMonthlyStats(monthly || { total: 0, completed: 0, missed: 0 });
      setHeatmapData(heatmap || []);
      setHabitTrends(trends || []);
      setExcusePatterns(excuses || []);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBestDay = () => {
    if (weeklyData.length === 0) return { label: '-', value: 0 };
    return weeklyData.reduce((best, current) => 
      current.value > best.value ? current : best
    );
  };

  const getAverageCompletion = () => {
    if (weeklyData.length === 0) return 0;
    const sum = weeklyData.reduce((acc, day) => acc + day.value, 0);
    return sum / weeklyData.length;
  };

  const getTotalCompletedThisWeek = () => {
    return weeklyData.reduce((acc, day) => acc + (day.completed || 0), 0);
  };

  const bestDay = getBestDay();
  const avgCompletion = getAverageCompletion();
  const totalCompletedThisWeek = getTotalCompletedThisWeek();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'daily':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Today's Overview
            </Text>
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={[colors.success + '20', colors.success + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {monthlyStats.completed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Completed
                </Text>
              </LinearGradient>
              
              <LinearGradient
                colors={[colors.danger + '20', colors.danger + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.danger + '20' }]}>
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {monthlyStats.missed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Missed
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  Daily Insight
                </Text>
              </View>
              <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                {monthlyStats.completed > monthlyStats.missed
                  ? 'Great job! You\'re completing more habits than missing them.'
                  : 'Try to focus on completing at least one habit today.'}
              </Text>
            </View>
          </Animated.View>
        );
      
      case 'weekly':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Weekly Performance
            </Text>
            
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Completion Rate
                </Text>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                  Last 7 days
                </Text>
              </View>
              <BarChart data={weeklyData} height={180} />
            </View>
            
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={[colors.warning + '20', colors.warning + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="trophy" size={24} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {bestDay.label}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Best Day
                </Text>
              </LinearGradient>
              
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '05']}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {avgCompletion.toFixed(0)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Avg Completion
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-done" size={24} color={colors.success} />
              <View style={styles.totalContent}>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {totalCompletedThisWeek}
                </Text>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                  Total habits completed this week
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      
      case 'monthly':
        return (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            <Text style={[styles.tabTitle, { color: colors.text }]}>
              Monthly Heatmap
            </Text>
            
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Completion Heatmap
                </Text>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                  Last 30 days
                </Text>
              </View>
              <CalendarHeatmap data={heatmapData} days={30} />
            </View>

            <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                Less
              </Text>
              {[0, 25, 50, 75, 100].map((value) => (
                <View
                  key={value}
                  style={[
                    styles.legendBox,
                    {
                      backgroundColor: value === 0 
                        ? colors.border 
                        : colors.primary,
                      opacity: value === 0 ? 1 : value / 100,
                    },
                  ]}
                />
              ))}
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                More
              </Text>
            </View>
          </Animated.View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loadingSpinner, { borderColor: colors.primary }]} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading statistics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Animated.View style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
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
          <Text style={[styles.title, { color: colors.text }]}>
            Statistics
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your progress over time
          </Text>
        </Animated.View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
          {[
            { key: 'daily', label: 'Daily', icon: 'today-outline' },
            { key: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
            { key: 'monthly', label: 'Monthly', icon: 'grid-outline' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as TabType)}
              style={[
                styles.tab,
                activeTab === tab.key && { 
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? '#fff' : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Habit Trends */}
        {habitTrends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Top Habits
              </Text>
              <Ionicons name="podium" size={20} color={colors.primary} />
            </View>
            {habitTrends.map((habit, index) => {
              const maxCount = habitTrends[0]?.completed_count || 1;
              const percentage = ((habit.completed_count || 0) / maxCount) * 100;
              
              return (
                <View key={index} style={[styles.trendItem, { backgroundColor: colors.card }]}>
                  <View style={[
                    styles.trendRank, 
                    { 
                      backgroundColor: index === 0 
                        ? colors.warning + '20' 
                        : colors.primary + '15',
                    },
                  ]}>
                    <Text style={[
                      styles.trendRankText, 
                      { 
                        color: index === 0 
                          ? colors.warning 
                          : colors.primary,
                      },
                    ]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={[styles.trendIcon, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name={habit.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.trendContent}>
                    <Text style={[styles.trendName, { color: colors.text }]}>
                      {habit.name}
                    </Text>
                    <View style={[styles.trendProgressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.trendProgressFill, 
                          { 
                            width: `${percentage}%`,
                            backgroundColor: index === 0 ? colors.warning : colors.primary,
                          },
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={[styles.trendCount, { color: colors.textSecondary }]}>
                    {habit.completed_count || 0}x
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Excuse Patterns */}
        {excusePatterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Common Excuses
              </Text>
              <Ionicons name="warning" size={20} color={colors.danger} />
            </View>
            <View style={[styles.excuseCard, { backgroundColor: colors.card }]}>
              {excusePatterns.map((excuse, index) => (
                <View key={index} style={styles.excuseItem}>
                  <View style={[styles.excuseIcon, { backgroundColor: colors.danger + '10' }]}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  </View>
                  <Text style={[styles.excuseText, { color: colors.text }]}>
                    {excuse.text}
                  </Text>
                  <View style={[styles.excuseBadge, { backgroundColor: colors.danger + '15' }]}>
                    <Text style={[styles.excuseCount, { color: colors.danger }]}>
                      {excuse.count}x
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: 'transparent',
  },
  loadingText: { marginTop: 16, fontSize: 14 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabContent: { paddingHorizontal: 20 },
  tabTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: { fontSize: 15, fontWeight: '600' },
  chartSubtitle: { fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: { fontSize: 15, fontWeight: '600' },
  insightText: { fontSize: 13, lineHeight: 20 },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  totalContent: { flex: 1 },
  totalValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  totalLabel: { fontSize: 12 },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  legendLabel: { fontSize: 11 },
  legendBox: { width: 20, height: 20, borderRadius: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  trendRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendRankText: { fontSize: 12, fontWeight: 'bold' },
  trendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContent: { flex: 1 },
  trendName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  trendProgressBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  trendProgressFill: { height: '100%', borderRadius: 2 },
  trendCount: { fontSize: 13, fontWeight: '600' },
  excuseCard: { borderRadius: 16, padding: 12 },
  excuseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  excuseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  excuseText: { flex: 1, fontSize: 14 },
  excuseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  excuseCount: { fontSize: 12, fontWeight: 'bold' },
});