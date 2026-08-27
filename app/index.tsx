import { Redirect } from 'expo-router';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function Index() {
  const { onboardingCompleted } = useSettingsStore();
  
  return <Redirect href={onboardingCompleted ? '/(tabs)' : '/(auth)/welcome'} />;
}