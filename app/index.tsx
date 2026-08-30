import { Redirect } from 'expo-router';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function Index() {
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  
  if (onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/welcome" />;
}