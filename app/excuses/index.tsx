import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExcuseStore } from '../../src/stores/excuseStore';
import { ExcuseCard } from '../../src/components/ExcuseCard/ExcuseCard';
import { useTheme } from '../../src/theme/ThemeContext';
import { Excuse } from '../../src/types';
import { lightTheme } from '../../src/theme';

export default function ExcusesListScreen() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const { excuses, mostCommonExcuses, fetchExcuses, fetchMostCommon, deleteExcuse } = useExcuseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    Animated.timing(analyticsAnimation, {
      toValue: showAnalytics ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showAnalytics]);

  const loadData = async () => {
    await Promise.all([
      fetchExcuses(),
      fetchMostCommon(5),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderExcuse = ({ item, index }: { item: Excuse; index: number }) => (
    <Animated.View
      style={{
        opacity: analyticsAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1],
        }),
        transform: [{
          translateY: analyticsAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0],
          }),
        }],
      }}
    >
      <ExcuseCard
        excuse={item}
        onPress={() => router.push(`/excuses/${item.id}`)}
        onLongPress={() => showExcuseOptions(item)}
      />
    </Animated.View>
  );

  const showExcuseOptions = (excuse: Excuse) => {
    Alert.alert(
      'Excuse',
      excuse.text,
      [
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Excuse',
              'Are you sure you want to delete this excuse?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteExcuse(excuse.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete excuse.');
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

  // Calculate total excuses and average per week
  const totalExcuses = excuses.length;
  const uniqueExcuses = new Set(excuses.map(e => e.text)).size;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Excuse Log</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Understand your patterns
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAnalytics(!showAnalytics)}
          style={[
            styles.analyticsButton, 
            { 
              backgroundColor: showAnalytics ? theme.colors.primary : theme.colors.card,
            }
          ]}
        >
          <Ionicons 
            name={showAnalytics ? 'close' : 'stats-chart'} 
            size={20} 
            color={showAnalytics ? '#fff' : theme.colors.primary} 
          />
        </Pressable>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.statIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {totalExcuses}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Excuses
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="pricetags" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {uniqueExcuses}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Unique Excuses
          </Text>
        </View>
      </View>

      {/* Analytics Section */}
      {showAnalytics && (
        <Animated.View 
          style={[
            styles.analyticsSection,
            {
              opacity: analyticsAnimation,
              transform: [{
                translateY: analyticsAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.analyticsHeader}>
            <Text style={[styles.analyticsTitle, { color: theme.colors.text }]}>
              Most Common Excuses
            </Text>
            {mostCommonExcuses.length > 0 && (
              <View style={[styles.insightBadge, { backgroundColor: theme.colors.warning + '15' }]}>
                <Ionicons name="bulb" size={14} color={theme.colors.warning} />
                <Text style={[styles.insightText, { color: theme.colors.warning }]}>
                  Pattern detected
                </Text>
              </View>
            )}
          </View>

          {mostCommonExcuses.length > 0 ? (
            mostCommonExcuses.map((excuse, index) => {
              const maxCount = mostCommonExcuses[0].count;
              const percentage = (excuse.count / maxCount) * 100;
              
              return (
                <View key={excuse.id} style={[styles.analyticsItem, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.analyticsItemHeader}>
                    <View style={[styles.rankBadge, { 
                      backgroundColor: index === 0 ? theme.colors.danger : 
                                     index === 1 ? theme.colors.warning : 
                                     theme.colors.primary 
                    }]}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.analyticsContent}>
                      <Text style={[styles.analyticsText, { color: theme.colors.text }]}>
                        {excuse.text}
                      </Text>
                      <Text style={[styles.analyticsCount, { color: theme.colors.textSecondary }]}>
                        Used {excuse.count} {excuse.count === 1 ? 'time' : 'times'}
                      </Text>
                    </View>
                    <View style={[styles.percentageBadge, { backgroundColor: theme.colors.card }]}>
                      <Text style={[styles.percentageText, { color: theme.colors.text }]}>
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress bar */}
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${percentage}%`,
                          backgroundColor: index === 0 ? theme.colors.danger : 
                                         index === 1 ? theme.colors.warning : 
                                         theme.colors.primary,
                        },
                      ]} 
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[styles.noAnalytics, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="happy-outline" size={32} color={theme.colors.success} />
              <Text style={[styles.noAnalyticsText, { color: theme.colors.textSecondary }]}>
                No patterns detected yet. Keep tracking!
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Excuse List */}
      <FlatList
        data={excuses}
        renderItem={renderExcuse}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContent,
          excuses.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          excuses.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: theme.colors.textSecondary }]}>
                Your Excuse History
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.success} />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No Excuses Logged Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              When you miss a habit, log your excuse to understand your patterns and improve
            </Text>
          </View>
        }
      />
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
  analyticsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  analyticsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  insightText: {
    fontSize: 11,
    fontWeight: '500',
  },
  analyticsItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  analyticsItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  analyticsCount: {
    fontSize: 12,
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  noAnalytics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 12,
  },
  noAnalyticsText: {
    fontSize: 14,
    textAlign: 'center',
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
    lineHeight: 20,
  },
});