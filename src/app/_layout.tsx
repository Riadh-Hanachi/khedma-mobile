import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth-context';
import { CountryProvider } from '@/lib/country-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CountryProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </CountryProvider>
    </AuthProvider>
  );
}
