import React, { useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../src/theme/ThemeContext';
import { backupService } from '../src/services/backupService';
import { lightTheme } from '../src/theme';

export default function DataManagementScreen() {
   const themeContext = useTheme();
  const theme = themeContext?.theme || lightTheme;
  const colors = theme.colors || lightTheme.colors;
  const [backupInfo, setBackupInfo] = useState({
    totalHabits: 0,
    totalLogs: 0,
    totalRoutines: 0,
    totalExcuses: 0,
    totalAchievements: 0,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBackupInfo();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const info = await backupService.getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error loading backup info:', error);
    }
  };

  const handleExport = async () => {
    Alert.alert(
      'Export Data',
      'This will create a JSON backup file of all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            try {
              const filePath = await backupService.exportData();
              await backupService.shareBackup(filePath);
              Alert.alert('Success', 'Data exported successfully!');
            } catch (error) {
              console.error('Export error:', error);
              Alert.alert('Error', 'Failed to export data.');
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        'Import Data',
        'This will replace all existing data with the backup data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              setIsImporting(true);
              try {
                const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
                await backupService.importData(fileContent);
                await loadBackupInfo();
                Alert.alert('Success', 'Data imported successfully!');
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Error', 'Failed to import data.');
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete ALL your data including habits, routines, logs, and achievements. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I understand, Reset Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This cannot be undone!',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setIsResetting(true);
                    try {
                      await backupService.resetDatabase();
                      Alert.alert(
                        'Success',
                        'All data has been reset. The app will now restart.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Navigate to onboarding
                              router.replace('/(auth)/welcome');
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      console.error('Reset error:', error);
                      Alert.alert('Error', 'Failed to reset data.');
                    } finally {
                      setIsResetting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
            Data Management
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Data Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
            Your Data
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {backupInfo.totalHabits}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Habits
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                {backupInfo.totalLogs}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Logs
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
                {backupInfo.totalRoutines}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Routines
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#9C27B0' }]}>
                {backupInfo.totalAchievements}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Achievements
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {/* Export */}
          <Pressable
            onPress={handleExport}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.actionCard,
              { 
                backgroundColor: theme.colors.card,
                opacity: pressed || isExporting ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '15' }]}>
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.colors.success} />
              ) : (
                <Ionicons name="download-outline" size={24} color={theme.colors.success} />
              )}
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                Export Data
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                Create a JSON backup file to share or store
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </Pressable>

          {/* Import */}
          <Pressable
            onPress={handleImport}
            disabled={isImporting}
            style={({ pressed }) => [
              styles.actionCard,
              { 
                backgroundColor: theme.colors.card,
                opacity: pressed || isImporting ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              {isImporting ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
              )}
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                Import Data
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                Restore from a backup JSON file
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </Pressable>

          {/* Reset */}
          <Pressable
            onPress={handleReset}
            disabled={isResetting}
            style={({ pressed }) => [
              styles.actionCard,
              { 
                backgroundColor: theme.colors.danger + '10',
                opacity: pressed || isResetting ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.danger + '15' }]}>
              {isResetting ? (
                <ActivityIndicator size="small" color={theme.colors.danger} />
              ) : (
                <Ionicons name="trash-outline" size={24} color={theme.colors.danger} />
              )}
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.colors.danger }]}>
                Reset All Data
              </Text>
              <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>
                Permanently delete all data and start fresh
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.danger} />
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Your data is stored locally on your device. Export regularly to keep a backup.
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
  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});