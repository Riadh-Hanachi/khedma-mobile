import { Stack } from 'expo-router';

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#111827' } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Nouvelle demande' }} />
      <Stack.Screen name="[id]" options={{ title: 'Demande' }} />
    </Stack>
  );
}
