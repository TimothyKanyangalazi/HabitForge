import { Redirect } from 'expo-router';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function Index() {
  const { settings } = useSettingsStore();
  
  return <Redirect href={settings.onboardingCompleted ? '/(tabs)' : '/(auth)/welcome'} />;
}