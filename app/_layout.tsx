import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';

// Prevent auto-hide only on native platforms
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="subscription-success" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}