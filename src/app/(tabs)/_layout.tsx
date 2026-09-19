import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { Brand } from '@/constants/theme';

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.screenBackground }}>
        <ActivityIndicator color={Brand.primary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  const isProvider = user.role === 'provider';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { color: '#111827' },
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Brand.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', headerTitle: 'Khedma', tabBarIcon: () => <TabIcon symbol="🏠" /> }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Rechercher',
          tabBarIcon: () => <TabIcon symbol="🔍" />,
          href: isProvider ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: isProvider ? 'Demandes' : 'Mes demandes',
          headerShown: false,
          tabBarIcon: () => <TabIcon symbol="📋" />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Mes services',
          tabBarIcon: () => <TabIcon symbol="🛠️" />,
          href: isProvider ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Réservations', tabBarIcon: () => <TabIcon symbol="📅" /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', headerShown: false, tabBarIcon: () => <TabIcon symbol="💬" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: () => <TabIcon symbol="👤" /> }}
      />
    </Tabs>
  );
}
