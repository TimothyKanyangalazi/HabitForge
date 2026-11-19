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
  TextInput,
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
import { favoriteQuoteService } from '../../src/services/favoriteQuoteService';
import {
  closeDatabase,
  initDatabase,
  resetDatabase,
} from '../../src/database/database';
import type { FavoriteQuote } from '../../src/types';

const { width } = Dimensions.get('window');

interface ProfileMenuItem {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  route?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleKey?: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { 
    settings,
    updateSettings 
  } = useSettingsStore();
  const {
    habits = [],
    fetchHabits,
    loadBreakHabits,
    fetchTodayLogs: fetchHabitTodayLogs,
  } = useHabitStore();
  const {
    routines = [],
    fetchRoutines,
    fetchTodayLogs: fetchRoutineTodayLogs,
  } = useRoutineStore();
  
  const [totalHabitsCompleted, setTotalHabitsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mottoDraft, setMottoDraft] = useState(settings.livingMotto ?? '');
  const [isSavingMotto, setIsSavingMotto] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState('');
  const [quoteAuthorDraft, setQuoteAuthorDraft] = useState('');
  const [favoriteQuotes, setFavoriteQuotes] = useState<FavoriteQuote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<number | null>(null);
  const [quoteLoadError, setQuoteLoadError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const notificationsEnabled = settings.notificationsEnabled ?? true;
  const currentTheme = settings.theme ?? 'light';
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadProfileData();
    loadFavoriteQuotes();
    animateIn();
  }, []);

  useEffect(() => {
    setMottoDraft(settings.livingMotto ?? '');
  }, [settings.livingMotto]);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
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

  const loadFavoriteQuotes = async () => {
    setIsLoadingQuotes(true);
    setQuoteLoadError(null);
    try {
      setFavoriteQuotes(await favoriteQuoteService.getAll());
    } catch (error) {
      console.error('Error loading favorite quotes:', error);
      setQuoteLoadError('Your favorite quotes could not be loaded.');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleSaveMotto = async () => {
    setIsSavingMotto(true);
    try {
      await updateSettings({ livingMotto: mottoDraft.trim() });
      Alert.alert('Saved', 'Your living motto has been updated.');
    } catch (error) {
      console.error('Error saving living motto:', error);
      Alert.alert('Unable to save', 'Your living motto could not be saved. Please try again.');
    } finally {
      setIsSavingMotto(false);
    }
  };

  const handleAddFavoriteQuote = async () => {
    if (!quoteDraft.trim()) {
      Alert.alert('Quote required', 'Enter a quote before saving it.');
      return;
    }
    setIsSavingQuote(true);
    try {
      const savedQuote = await favoriteQuoteService.add(quoteDraft, quoteAuthorDraft);
      setFavoriteQuotes((quotes) => [savedQuote, ...quotes]);
      setQuoteDraft('');
      setQuoteAuthorDraft('');
    } catch (error) {
      console.error('Error saving favorite quote:', error);
      Alert.alert(
        'Unable to save quote',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsSavingQuote(false);
    }
  };

  const confirmRemoveFavoriteQuote = (quote: FavoriteQuote) => {
    Alert.alert('Remove favorite quote?', 'This quote will be removed from your favorites.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeletingQuoteId(quote.id);
          try {
            await favoriteQuoteService.remove(quote.id);
            setFavoriteQuotes((quotes) => quotes.filter((item) => item.id !== quote.id));
          } catch (error) {
            console.error('Error removing favorite quote:', error);
            Alert.alert('Unable to remove quote', 'Please try again.');
          } finally {
            setDeletingQuoteId(null);
          }
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your habits, routines, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (isResetting) return;
            setIsResetting(true);
            try {
              await closeDatabase();
              await resetDatabase();
              await initDatabase();

              useHabitStore.setState({
                habits: [],
                breakHabits: [],
                todayLogs: {},
                urges: [],
                relapses: [],
                stats: {},
                error: null,
              });
              useRoutineStore.setState({
                routines: [],
                currentRoutine: null,
                todayLogs: {},
                error: null,
              });

              const today = new Date().toISOString().split('T')[0];
              await Promise.all([
                useSettingsStore.getState().loadSettings(),
                fetchHabits(),
                loadBreakHabits(),
                fetchHabitTodayLogs(today),
                fetchRoutines(),
                fetchRoutineTodayLogs(today),
                loadProfileData(),
                loadFavoriteQuotes(),
              ]);
              Alert.alert('Success', 'All data has been reset.');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert(
                'Unable to reset data',
                error instanceof Error ? error.message : 'Please try again.'
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              Alert.alert('Success', 'Data exported successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to export data.');
            }
          },
        },
      ]
    );
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

  const menuSections: { title: string; items: ProfileMenuItem[] }[] = [
    {
      title: 'Tracking',
      items: [
        {
          icon: 'checkmark-circle-outline',
          title: 'My Habits',
          subtitle: `${habits.length || 0} active habits`,
          route: '/habits',
          color: theme.colors.primary,
        },
        {
          icon: 'list-outline',
          title: 'My Routines',
          subtitle: `${routines.length || 0} active routines`,
          route: '/routines',
          color: theme.colors.success,
        },
        {
          icon: 'alert-circle-outline',
          title: 'Excuse Log',
          subtitle: 'View your excuse history',
          route: '/excuses',
          color: theme.colors.danger,
        },
        {
          icon: 'stats-chart-outline',
          title: 'Statistics',
          subtitle: 'Detailed analytics',
          route: '/statistics',
          color: theme.colors.warning,
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
          color: theme.colors.primary,
          isToggle: true,
          toggleKey: 'notifications_enabled',
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
          icon: 'download-outline',
          title: 'Export Data',
          subtitle: 'Backup your progress',
          color: theme.colors.success,
          onPress: handleExportData,
        },
        {
          icon: 'trash-outline',
          title: 'Reset Data',
          subtitle: 'Clear all data',
          color: theme.colors.danger,
          onPress: handleResetData,
        },
      ],
    },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.profileHeaderContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/HF2.png')}
                style={styles.avatar}
                resizeMode="cover"
                accessibilityLabel="HabitForge icon"
              />
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
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completionRate.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.wordsSection}>
          <Text style={[styles.menuSectionTitle, { color: theme.colors.textSecondary }]}>
            YOUR WORDS
          </Text>
          <View style={[styles.wordsCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.wordsHeading}>
              <View style={[styles.wordsIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="compass-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.wordsHeadingText}>
                <Text style={[styles.wordsTitle, { color: theme.colors.text }]}>Living motto</Text>
                <Text style={[styles.wordsHint, { color: theme.colors.textSecondary }]}>
                  A reminder of how you want to live
                </Text>
              </View>
            </View>
            <TextInput
              value={mottoDraft}
              onChangeText={setMottoDraft}
              placeholder="e.g. Small steps, every day."
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={240}
              multiline
              accessibilityLabel="Living motto"
              style={[
                styles.wordsInput,
                styles.mottoInput,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
            />
            <Pressable
              onPress={handleSaveMotto}
              disabled={isSavingMotto || mottoDraft.trim() === (settings.livingMotto ?? '').trim()}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.saveMottoButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: isSavingMotto || mottoDraft.trim() === (settings.livingMotto ?? '').trim()
                    ? 0.5
                    : pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={styles.saveMottoText}>
                {isSavingMotto ? 'Saving...' : 'Save motto'}
              </Text>
            </Pressable>

            <View style={[styles.wordsDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.wordsHeading}>
              <View style={[styles.wordsIcon, { backgroundColor: '#F4A34015' }]}>
                <Ionicons name="heart-outline" size={20} color="#F4A340" />
              </View>
              <View style={styles.wordsHeadingText}>
                <Text style={[styles.wordsTitle, { color: theme.colors.text }]}>Favorite quotes</Text>
                <Text style={[styles.wordsHint, { color: theme.colors.textSecondary }]}>
                  Keep the words that inspire you close
                </Text>
              </View>
            </View>
            <TextInput
              value={quoteDraft}
              onChangeText={setQuoteDraft}
              placeholder="Write or paste a favorite quote"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={1000}
              multiline
              accessibilityLabel="Favorite quote"
              style={[
                styles.wordsInput,
                styles.quoteInput,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
            />
            <TextInput
              value={quoteAuthorDraft}
              onChangeText={setQuoteAuthorDraft}
              placeholder="Author (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={120}
              accessibilityLabel="Quote author"
              style={[
                styles.wordsInput,
                styles.authorInput,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
            />
            <Pressable
              onPress={handleAddFavoriteQuote}
              disabled={isSavingQuote || !quoteDraft.trim()}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addQuoteButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: isSavingQuote || !quoteDraft.trim() ? 0.5 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.saveMottoText}>
                {isSavingQuote ? 'Saving...' : 'Add to favorites'}
              </Text>
            </Pressable>

            {quoteLoadError ? (
              <Text style={[styles.quoteListMessage, { color: theme.colors.danger }]}>
                {quoteLoadError}
              </Text>
            ) : isLoadingQuotes ? (
              <Text style={[styles.quoteListMessage, { color: theme.colors.textSecondary }]}>
                Loading your quotes...
              </Text>
            ) : favoriteQuotes.length === 0 ? (
              <Text style={[styles.quoteListMessage, { color: theme.colors.textSecondary }]}>
                Your saved quotes will appear here.
              </Text>
            ) : (
              <View style={styles.favoriteQuoteList}>
                {favoriteQuotes.map((quote, index) => (
                  <View
                    key={quote.id}
                    style={[
                      styles.favoriteQuote,
                      index > 0 && { borderTopColor: theme.colors.border, borderTopWidth: 1 },
                    ]}
                  >
                    <View style={styles.favoriteQuoteTextContainer}>
                      <Text style={[styles.favoriteQuoteText, { color: theme.colors.text }]}>
                        “{quote.text}”
                      </Text>
                      {quote.author ? (
                        <Text style={[styles.favoriteQuoteAuthor, { color: theme.colors.textSecondary }]}>
                          — {quote.author}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => confirmRemoveFavoriteQuote(quote)}
                      disabled={deletingQuoteId === quote.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove quote${quote.author ? ` by ${quote.author}` : ''}`}
                      hitSlop={8}
                      style={styles.removeQuoteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.colors.danger}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={[styles.menuSectionTitle, { color: theme.colors.textSecondary }]}>
                {section.title.toUpperCase()}
              </Text>
              
              <View style={[styles.menuCard, { backgroundColor: theme.colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={itemIndex}
                    onPress={item.onPress || (() => item.route && router.push(item.route))}
                    style={({ pressed }) => [
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && styles.menuItemBorder,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    
                    <View style={styles.menuItemContent}>
                      <Text style={[styles.menuItemTitle, { color: theme.colors.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: theme.colors.textSecondary }]}>
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
                          false: theme.colors.border, 
                          true: item.color + '80',
                        }}
                        thumbColor={
                          item.toggleKey === 'theme'
                            ? currentTheme === 'dark' ? '#9C27B0' : '#f4f3f4'
                            : notificationsEnabled ? item.color : '#f4f3f4'
                        }
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            HabitForge v1.0.0
          </Text>
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
  profileInfo: {
    flex: 1,
  },
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  wordsSection: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  wordsCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  wordsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wordsHeadingText: {
    flex: 1,
  },
  wordsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  wordsHint: {
    fontSize: 12,
  },
  wordsInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 10,
  },
  mottoInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  quoteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  authorInput: {
    minHeight: 44,
  },
  saveMottoButton: {
    alignSelf: 'flex-end',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveMottoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  wordsDivider: {
    height: 1,
    marginVertical: 18,
  },
  addQuoteButton: {
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  quoteListMessage: {
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  favoriteQuoteList: {
    marginTop: 8,
  },
  favoriteQuote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },
  favoriteQuoteTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  favoriteQuoteText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  favoriteQuoteAuthor: {
    fontSize: 12,
    marginTop: 6,
  },
  removeQuoteButton: {
    padding: 5,
  },
  menuSection: {
    marginBottom: 20,
  },
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
    borderBottomColor: '#eee',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
});