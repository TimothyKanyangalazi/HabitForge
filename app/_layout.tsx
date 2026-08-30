import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { initDatabase, resetDatabase, getDatabase } from '../src/database/database';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { loadSettings, settings } = useSettingsStore();

  const setupDatabase = async () => {
    try {
      setDbError(null);
      await initDatabase();
      await loadSettings();
      setDbReady(true);
      console.log('✅ Database ready');
    } catch (error) {
      console.error('❌ Database error:', error);
      setDbError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    setupDatabase();
  }, []);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setDbError(null);
      setDbReady(false);
      
      const db = getDatabase();
      await db.closeAsync();
      
      await resetDatabase();
      await setupDatabase();
      
      console.log('✅ Database reset and ready');
    } catch (error) {
      console.error('❌ Reset error:', error);
      setDbError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsResetting(false);
    }
  };

  if (dbError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorText}>{dbError}</Text>
        <Pressable
          onPress={handleReset}
          disabled={isResetting}
          style={[styles.button, isResetting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Modal screens */}
        <Stack.Screen 
          name="habit/create" 
          options={{ presentation: 'modal', title: 'Create Habit', headerShown: true }} 
        />
        <Stack.Screen 
          name="habit/edit" 
          options={{ presentation: 'modal', title: 'Edit Habit', headerShown: true }} 
        />
        <Stack.Screen 
          name="routine/create" 
          options={{ presentation: 'modal', title: 'Create Routine', headerShown: true }} 
        />
        <Stack.Screen 
          name="excuses/create" 
          options={{ presentation: 'modal', title: 'Log Excuse', headerShown: true }} 
        />
        
        {/* Regular screens */}
        <Stack.Screen name="habit/[id]" options={{ title: 'Habit Details', headerShown: true }} />
        <Stack.Screen name="routine/[id]" options={{ title: 'Routine Details', headerShown: true }} />
        <Stack.Screen name="excuses/index" options={{ title: 'Excuse Log', headerShown: true }} />
        <Stack.Screen name="excuses/[id]" options={{ title: 'Excuse Details', headerShown: true }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements', headerShown: true }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
        
        {/* Custom screens without header */}
        <Stack.Screen name="streaks" options={{ headerShown: false }} />
        <Stack.Screen name="notifications-settings" options={{ headerShown: false }} />
        <Stack.Screen name="data-management" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});