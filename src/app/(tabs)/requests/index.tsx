import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ServiceRequest } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Brand } from '@/constants/theme';

export default function RequestsScreen() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const load = useCallback(() => {
    const path = isProvider ? '/requests/matching' : '/requests/mine';
    api
      .get<ServiceRequest[]>(path)
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [isProvider]);

  useFocusEffect(load);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{isProvider ? 'Demandes ouvertes' : 'Mes demandes'}</Text>
        {!isProvider && (
          <Pressable style={styles.newButton} onPress={() => router.push('/(tabs)/requests/new')}>
            <Text style={styles.newButtonText}>+ Nouvelle</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={requests}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/requests/${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardMeta}>
              {item.category?.name} · {item.city}
              {item.urgent ? ' · URGENT' : ''}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune demande pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  newButton: { backgroundColor: Brand.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontWeight: '600', color: '#111827', flex: 1 },
  cardMeta: { fontSize: 12, color: Brand.muted, marginTop: 4 },
  empty: { color: Brand.muted, fontSize: 13, textAlign: 'center', marginTop: 24 },
});
