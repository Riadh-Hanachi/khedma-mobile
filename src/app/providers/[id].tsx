import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { LoyaltyAccount, ProviderProfile, Review, ServiceOffering } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, ErrorText, SuccessText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [useCredit, setUseCredit] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ProviderProfile>(`/providers/${id}`).then(setProvider).catch(() => setProvider(null));
    api.get<{ items: ServiceOffering[] }>(`/services?providerId=${id}`).then((res) => setServices(res.items)).catch(() => setServices([]));
    api.get<Review[]>(`/reviews/provider/${id}`).then(setReviews).catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (user?.role === 'client') {
      api.get<LoyaltyAccount>('/loyalty/me').then(setLoyalty).catch(() => setLoyalty(null));
    }
  }, [user]);

  async function handleContact() {
    if (!user) return router.push('/(auth)/login');
    try {
      const conversation = await api.post<{ id: string }>('/conversations', { providerId: id });
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de démarrer la conversation');
    }
  }

  async function handleFavorite() {
    if (!user) return router.push('/(auth)/login');
    try {
      await api.post(`/favorites/${id}`);
      setMessage('Ajouté aux favoris');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'ajouter aux favoris");
    }
  }

  async function handleApplyCoupon(serviceId: string) {
    setCouponError(null);
    setAppliedDiscount(null);
    const service = services.find((s) => s.id === serviceId);
    try {
      const res = await api.post<{ discountAmount: number }>('/promotions/validate', {
        code: couponCode,
        amount: service?.price ?? 0,
        categoryId: service?.categoryId,
        city: provider?.zones?.[0] || provider?.user?.city,
        currency: service?.currency,
      });
      setAppliedDiscount(res.discountAmount);
    } catch (e) {
      setCouponError(e instanceof ApiError ? e.message : "Impossible d'appliquer ce code");
    }
  }

  async function handleBook(serviceId: string) {
    if (!user) return router.push('/(auth)/login');
    setError(null);
    try {
      const service = services.find((s) => s.id === serviceId);
      await api.post('/bookings', {
        providerId: id,
        serviceId,
        scheduledAt: new Date().toISOString(),
        addressLine,
        price: service?.price ?? 0,
        useCreditAmount: useCredit ? loyalty?.creditBalance ?? 0 : 0,
        couponCode: appliedDiscount !== null ? couponCode : undefined,
        categoryId: service?.categoryId,
      });
      setMessage('Réservation envoyée ! Suivez son statut dans vos réservations.');
      setBookingServiceId(null);
      setUseCredit(false);
      setCouponCode('');
      setAppliedDiscount(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de réserver');
    }
  }

  if (!provider) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chargement...</Text>
      </View>
    );
  }

  const name = provider.companyName || `${provider.user?.firstName ?? ''} ${provider.user?.lastName ?? ''}`.trim();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: name || 'Prestataire' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {error && <ErrorText>{error}</ErrorText>}
        {message && <SuccessText>{message}</SuccessText>}

        <View style={styles.card}>
          <Text style={styles.name}>{name || 'Prestataire'}</Text>
          <Text style={styles.muted}>{provider.category?.name}</Text>
          <Text style={styles.muted}>⭐ {provider.avgRating || '—'} ({provider.reviewsCount} avis)</Text>
          <Text style={styles.description}>{provider.description}</Text>
          <Text style={styles.muted}>{provider.experienceYears} ans d&apos;expérience · {provider.completedBookingsCount} prestations réalisées</Text>
          {provider.verificationLevel !== 'none' && <Text style={styles.verified}>✓ Vérifié ({provider.verificationLevel})</Text>}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Button title="Envoyer un message" onPress={handleContact} />
            </View>
            <View style={styles.flex1}>
              <Button title="♥ Favoris" variant="outline" onPress={handleFavorite} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Services proposés</Text>
        {services.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.serviceTitle}>{s.title}</Text>
                <Text style={styles.muted}>{s.description}</Text>
              </View>
              <Text style={styles.price}>{s.price} {s.currency}</Text>
            </View>
            <Button
              title={bookingServiceId === s.id ? 'Annuler' : 'Réserver'}
              variant="outline"
              onPress={() => setBookingServiceId(bookingServiceId === s.id ? null : s.id)}
            />
            {bookingServiceId === s.id && (
              <View style={styles.bookingBox}>
                <Field placeholder="Adresse d'intervention" value={addressLine} onChangeText={setAddressLine} />
                {loyalty && loyalty.creditBalance > 0 && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Utiliser mon crédit ({loyalty.creditBalance} {s.currency})</Text>
                    <Switch value={useCredit} onValueChange={setUseCredit} trackColor={{ true: Brand.primary }} />
                  </View>
                )}
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Field
                      placeholder="Code promo"
                      value={couponCode}
                      onChangeText={(v) => {
                        setCouponCode(v.toUpperCase());
                        setAppliedDiscount(null);
                      }}
                    />
                  </View>
                  <Button title="Appliquer" variant="outline" onPress={() => handleApplyCoupon(s.id)} disabled={!couponCode} />
                </View>
                {couponError && <ErrorText>{couponError}</ErrorText>}
                {appliedDiscount !== null && <SuccessText>{`Réduction de ${appliedDiscount} ${s.currency} appliquée`}</SuccessText>}
                <Button title="Confirmer la réservation" onPress={() => handleBook(s.id)} />
              </View>
            )}
          </View>
        ))}
        {services.length === 0 && <Text style={styles.muted}>Aucun service publié pour le moment.</Text>}

        <Text style={styles.sectionTitle}>Avis clients</Text>
        {reviews.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.serviceTitle}>
              {r.client?.firstName} {r.client?.lastName?.[0]}. · ⭐ {r.rating}
            </Text>
            {r.comment && <Text style={styles.description}>{r.comment}</Text>}
            {r.providerReply && <Text style={styles.reply}>Réponse : {r.providerReply}</Text>}
          </View>
        ))}
        {reviews.length === 0 && <Text style={styles.muted}>Pas encore d&apos;avis.</Text>}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  serviceTitle: { fontWeight: '600', color: '#111827' },
  description: { color: '#374151' },
  muted: { color: Brand.muted, fontSize: 13 },
  verified: { color: Brand.primaryDark, fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontWeight: '700', fontSize: 15, color: '#111827', marginTop: 4 },
  price: { fontWeight: '700', color: '#111827' },
  bookingBox: { gap: 10, borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 13, color: '#374151', flex: 1 },
  reply: { fontSize: 13, color: Brand.muted, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
});
