import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useCurrencySymbol } from '@/lib/country-context';
import { api, ApiError } from '@/lib/api';
import { DraftQuote, ProviderMatch, Quote, ServiceRequest } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, ErrorText, SuccessText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const providerCurrencySymbol = useCurrencySymbol(user?.countryCode);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ laborPrice: '', materialPrice: '', travelPrice: '', message: '' });
  const [aiQuoteText, setAiQuoteText] = useState('');
  const [aiQuoteLoading, setAiQuoteLoading] = useState(false);
  const [aiQuoteError, setAiQuoteError] = useState<string | null>(null);
  const requestBudgetCurrencySymbol = useCurrencySymbol(request?.client?.countryCode);

  const load = useCallback(() => {
    api.get<ServiceRequest>(`/requests/${id}`).then(setRequest).catch(() => setRequest(null));
    api.get<Quote[]>(`/quotes/for-request/${id}`).then(setQuotes).catch(() => setQuotes([]));
    if (!isProvider) {
      api.get<ProviderMatch[]>(`/requests/${id}/matches`).then(setMatches).catch(() => setMatches([]));
    }
  }, [id, isProvider]);

  useFocusEffect(load);

  async function sendQuote() {
    setError(null);
    try {
      await api.post('/quotes', {
        requestId: id,
        laborPrice: Number(quoteForm.laborPrice || 0),
        materialPrice: Number(quoteForm.materialPrice || 0),
        travelPrice: Number(quoteForm.travelPrice || 0),
        message: quoteForm.message,
      });
      setMessage('Devis envoyé au client.');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'envoyer le devis");
    }
  }

  async function handleAiDraftQuote() {
    setAiQuoteError(null);
    setAiQuoteLoading(true);
    try {
      const draft = await api.post<DraftQuote>('/ai/draft-quote', { text: aiQuoteText, requestId: id });
      setQuoteForm({
        laborPrice: String(draft.laborPrice),
        materialPrice: String(draft.materialPrice),
        travelPrice: String(draft.travelPrice),
        message: draft.message,
      });
    } catch (e) {
      setAiQuoteError(e instanceof ApiError ? e.message : 'Impossible de générer un brouillon');
    } finally {
      setAiQuoteLoading(false);
    }
  }

  async function cancelRequest() {
    try {
      await api.patch(`/requests/${id}/cancel`);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'annuler");
    }
  }

  async function acceptQuote(quote: Quote) {
    setError(null);
    try {
      await api.patch(`/quotes/${quote.id}/accept`);
      await api.post('/bookings', {
        providerId: quote.providerId,
        requestId: request?.id,
        quoteId: quote.id,
        scheduledAt: request?.desiredDate || new Date().toISOString(),
        addressLine: request?.addressLine,
        city: request?.city,
        price: quote.totalPrice,
      });
      setMessage('Devis accepté, réservation créée !');
      load();
      router.push('/(tabs)/bookings');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'accepter ce devis");
    }
  }

  async function rejectQuote(quote: Quote) {
    try {
      await api.patch(`/quotes/${quote.id}/reject`);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de refuser');
    }
  }

  async function contactProvider(providerId: string) {
    try {
      const conversation = await api.post<{ id: string }>('/conversations', { providerId, requestId: id });
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de contacter ce prestataire');
    }
  }

  async function contactClient() {
    if (!request) return;
    try {
      const profile = await api.get<{ id: string }>('/providers/me');
      const conversation = await api.post<{ id: string }>('/conversations', {
        providerId: profile.id,
        requestId: request.id,
      });
      router.push(`/(tabs)/messages/${conversation.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de contacter le client');
    }
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chargement...</Text>
      </View>
    );
  }

  const myQuote = quotes.find((q) => q.provider?.userId === user?.id);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error && <ErrorText>{error}</ErrorText>}
      {message && <SuccessText>{message}</SuccessText>}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.flex1}>
            <Text style={styles.requestTitle}>
              {request.title} {request.urgent ? ' · URGENT' : ''}
            </Text>
            <Text style={styles.muted}>
              {request.category?.name} · {request.city}
            </Text>
          </View>
          <StatusBadge status={request.status} />
        </View>
        <Text style={styles.description}>{request.description}</Text>
        {request.budget && (
          <Text style={styles.muted}>Budget indicatif : {request.budget} {requestBudgetCurrencySymbol}</Text>
        )}

        {!isProvider && request.status === 'open' && (
          <Button title="Annuler cette demande" variant="danger" onPress={cancelRequest} />
        )}
        {isProvider && <Button title="Contacter le client" variant="outline" onPress={contactClient} />}
      </View>

      {isProvider && !myQuote && request.status === 'open' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Envoyer un devis</Text>

          <View style={styles.aiBox}>
            <Text style={styles.aiTitle}>✨ Assistant de devis</Text>
            {aiQuoteError && <ErrorText>{aiQuoteError}</ErrorText>}
            <Field placeholder="Ex : remplacement climatiseur + déplacement 20km" value={aiQuoteText} onChangeText={setAiQuoteText} />
            <Button title={aiQuoteLoading ? 'Génération...' : 'Générer un brouillon'} onPress={handleAiDraftQuote} loading={aiQuoteLoading} disabled={!aiQuoteText} variant="outline" />
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field placeholder="Main-d'œuvre" value={quoteForm.laborPrice} onChangeText={(v) => setQuoteForm({ ...quoteForm, laborPrice: v })} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <Field placeholder="Matériel" value={quoteForm.materialPrice} onChangeText={(v) => setQuoteForm({ ...quoteForm, materialPrice: v })} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <Field placeholder="Déplacement" value={quoteForm.travelPrice} onChangeText={(v) => setQuoteForm({ ...quoteForm, travelPrice: v })} keyboardType="numeric" />
            </View>
          </View>
          <Field placeholder="Message (délai, garantie...)" value={quoteForm.message} onChangeText={(v) => setQuoteForm({ ...quoteForm, message: v })} multiline numberOfLines={3} />
          <Text style={styles.muted}>
            Total : {Number(quoteForm.laborPrice || 0) + Number(quoteForm.materialPrice || 0) + Number(quoteForm.travelPrice || 0)} {providerCurrencySymbol}
          </Text>
          <Button title="Envoyer le devis" onPress={sendQuote} />
        </View>
      )}

      {!isProvider && matches.length > 0 && request.status === 'open' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prestataires recommandés</Text>
          {matches.map((m) => {
            const name = m.provider.companyName || `${m.provider.user?.firstName ?? ''} ${m.provider.user?.lastName ?? ''}`.trim();
            return (
              <View key={m.provider.id} style={styles.card}>
                <Text style={styles.requestTitle}>{name}</Text>
                <Text style={styles.muted}>⭐ {m.provider.avgRating || '—'}</Text>
                <View style={styles.reasonsRow}>
                  {m.reasons.map((r) => (
                    <View key={r} style={styles.reasonChip}>
                      <Text style={styles.reasonText}>{r}</Text>
                    </View>
                  ))}
                </View>
                <Button title="Contacter" variant="outline" onPress={() => contactProvider(m.provider.id)} />
              </View>
            );
          })}
        </View>
      )}

      {!isProvider && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devis reçus ({quotes.length})</Text>
          {quotes.map((q) => (
            <View key={q.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.requestTitle}>{q.provider?.companyName || `${q.provider?.user?.firstName} ${q.provider?.user?.lastName}`}</Text>
                  <Text style={styles.muted}>{q.message}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.price}>{q.totalPrice} {q.currency}</Text>
                  <StatusBadge status={q.status} />
                </View>
              </View>
              {q.status === 'pending' && request.status !== 'accepted' && (
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Button title="Accepter" onPress={() => acceptQuote(q)} />
                  </View>
                  <View style={styles.flex1}>
                    <Button title="Refuser" variant="outline" onPress={() => rejectQuote(q)} />
                  </View>
                </View>
              )}
            </View>
          ))}
          {quotes.length === 0 && <Text style={styles.muted}>Aucun devis reçu pour l&apos;instant.</Text>}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.screenBackground },
  flex1: { flex: 1 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  requestTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  description: { color: '#374151' },
  muted: { color: Brand.muted, fontSize: 13 },
  section: { gap: 10 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  row: { flexDirection: 'row', gap: 8 },
  price: { fontWeight: '700', color: '#111827' },
  aiBox: { backgroundColor: Brand.successBackground, borderRadius: 10, padding: 10, gap: 8 },
  aiTitle: { fontWeight: '700', color: Brand.primaryDark, fontSize: 13 },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reasonChip: { backgroundColor: Brand.successBackground, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  reasonText: { fontSize: 11, color: Brand.primaryDark },
});
