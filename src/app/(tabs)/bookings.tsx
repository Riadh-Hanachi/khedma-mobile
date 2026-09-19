import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import { Booking, BookingStatus } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { ErrorText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  disputed: [],
};

const STATUS_ACTION_LABELS: Record<BookingStatus, string> = {
  pending: 'Confirmer',
  confirmed: 'Démarrer',
  in_progress: 'Terminer',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'Litige',
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Booking[]>('/bookings/mine').then(setBookings).catch(() => setBookings([]));
  }, []);

  useFocusEffect(load);

  async function updateStatus(booking: Booking, status: BookingStatus) {
    setError(null);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Réservations</Text>
      {error && <ErrorText>{error}</ErrorText>}
      <FlatList
        contentContainerStyle={styles.list}
        data={bookings}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => {
          const otherPartyName = isProvider
            ? `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`
            : item.provider?.companyName || `${item.provider?.user?.firstName ?? ''} ${item.provider?.user?.lastName ?? ''}`;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>{item.service?.title || 'Prestation sur devis'}</Text>
                  <Text style={styles.muted}>
                    Avec {otherPartyName} · {new Date(item.scheduledAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.price}>{item.price} {item.currency}</Text>
                  <StatusBadge status={item.status} />
                </View>
              </View>
              {isProvider && NEXT_STATUS[item.status].length > 0 && (
                <View style={styles.row}>
                  {NEXT_STATUS[item.status].map((next) => (
                    <View key={next} style={styles.flex1}>
                      <Button
                        title={STATUS_ACTION_LABELS[next]}
                        variant={next === 'cancelled' ? 'danger' : 'primary'}
                        onPress={() => updateStatus(item, next)}
                      />
                    </View>
                  ))}
                </View>
              )}
              {!isProvider && item.status === 'pending' && (
                <Button title="Annuler" variant="danger" onPress={() => updateStatus(item, 'cancelled')} />
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.muted}>Aucune réservation pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 0 },
  list: { padding: 16, gap: 10 },
  flex1: { flex: 1 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontWeight: '600', color: '#111827' },
  muted: { color: Brand.muted, fontSize: 12, marginTop: 4 },
  price: { fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', gap: 8 },
});
