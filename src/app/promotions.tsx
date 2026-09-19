import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/lib/api';
import { Promotion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get<Promotion[]>('/promotions/active').then(setPromotions).catch(() => setPromotions([]));
    }, []),
  );

  async function copyCode(code: string) {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Promotions' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Copiez un code et appliquez-le lors d&apos;une réservation directe.</Text>
        {promotions.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.code}>{p.code}</Text>
              <Button title={copiedCode === p.code ? 'Copié !' : 'Copier'} variant="outline" onPress={() => copyCode(p.code)} />
            </View>
            {p.description && <Text style={styles.description}>{p.description}</Text>}
            <Text style={styles.value}>
              {p.type === 'percentage' ? `-${p.value}%` : `-${p.value} ${p.currency}`}
              {p.maxDiscountAmount ? ` (jusqu'à ${p.maxDiscountAmount} ${p.currency})` : ''}
            </Text>
            <View style={styles.tags}>
              {p.minBookingAmount && <Text style={styles.tag}>Dès {p.minBookingAmount} {p.currency}</Text>}
              {p.firstBookingOnly && <Text style={styles.tag}>Première commande</Text>}
              {p.city && <Text style={styles.tag}>{p.city} uniquement</Text>}
              {p.category?.name && <Text style={styles.tag}>{p.category.name} uniquement</Text>}
            </View>
          </View>
        ))}
        {promotions.length === 0 && <Text style={styles.muted}>Aucune promotion active pour le moment.</Text>}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hint: { color: Brand.muted, fontSize: 13 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontWeight: '700', color: Brand.primaryDark, fontSize: 16 },
  description: { color: '#374151', fontSize: 13 },
  value: { fontWeight: '600', color: '#111827' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, color: Brand.muted, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  muted: { color: Brand.muted, fontSize: 13, textAlign: 'center', marginTop: 24 },
});
