// app/(auth)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function AuthLayout() {
  // Use selector to get nested value properly
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const hasLoaded = useSettingsStore((state) => state.hasLoaded);
  
  console.log('🔍 Auth Layout - onboardingCompleted:', onboardingCompleted);
  console.log('🔍 Auth Layout - hasLoaded:', hasLoaded);
  
  // Only redirect if settings are loaded and onboarding is complete
  if (hasLoaded && onboardingCompleted) {
    console.log('🔄 Redirecting to tabs from auth');
    return <Redirect href="/(tabs)" />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}