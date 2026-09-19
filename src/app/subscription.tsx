import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCurrencySymbol } from '@/lib/country-context';
import { ProviderProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SuccessText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

const PLANS = [
  { id: 'free', name: 'Gratuit', price: '0', features: ['Profil basique', 'Services illimités', 'Réception de demandes'] },
  { id: 'pro', name: 'Pro', price: 'Sur devis', features: ['Tout Gratuit', 'Meilleure visibilité', 'Statistiques avancées', 'Portfolio avancé'] },
  { id: 'business', name: 'Business', price: 'Sur devis', features: ['Tout Pro', 'Équipe / techniciens', 'Calendrier avancé', 'Accès API'] },
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const currencySymbol = useCurrencySymbol(user?.countryCode);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    api.get<ProviderProfile>('/providers/me').then(setProvider);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Abonnement' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Le paiement en ligne n&apos;est pas encore disponible. Le passage à un plan payant est activé manuellement par l&apos;équipe Khedma après demande.
        </Text>

        {provider && (
          <Text style={styles.current}>
            Plan actuel : <Text style={styles.currentValue}>{provider.subscriptionPlan}</Text>
          </Text>
        )}

        {PLANS.map((plan) => {
          const isCurrent = provider?.subscriptionPlan === plan.id;
          return (
            <View key={plan.id} style={[styles.card, isCurrent && styles.cardActive]}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price === 'Sur devis' ? plan.price : `${plan.price} ${currencySymbol}`}</Text>
              {plan.features.map((f) => (
                <Text key={f} style={styles.feature}>✓ {f}</Text>
              ))}
              {isCurrent ? (
                <Text style={styles.currentLabel}>Plan actuel</Text>
              ) : plan.id !== 'free' ? (
                <Button title="Demander ce plan" variant="outline" onPress={() => setRequested(true)} disabled={requested} />
              ) : null}
            </View>
          );
        })}

        {requested && <SuccessText>Demande enregistrée. Contactez l&apos;équipe Khedma pour finaliser l&apos;activation.</SuccessText>}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hint: { color: Brand.muted, fontSize: 13 },
  current: { fontSize: 14, color: '#374151' },
  currentValue: { fontWeight: '700', textTransform: 'capitalize' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 16, gap: 6 },
  cardActive: { borderColor: Brand.primary },
  planName: { fontWeight: '700', color: '#111827', fontSize: 15 },
  planPrice: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  feature: { fontSize: 13, color: '#374151' },
  currentLabel: { color: Brand.primaryDark, fontWeight: '600', fontSize: 13, marginTop: 6 },
});
