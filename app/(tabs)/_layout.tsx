import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="habits" 
        options={{ 
          title: 'Habits', 
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="routines" 
        options={{ 
          title: 'Routines', 
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="statistics" 
        options={{ 
          title: 'Statistics', 
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> 
        }} 
      />
    </Tabs>
  );
}