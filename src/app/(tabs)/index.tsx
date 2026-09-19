import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useCountry } from '@/lib/country-context';
import { Category, Paginated, ProviderProfile } from '@/lib/types';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function HomeScreen() {
  const { countries, countryCode, setCountryCode } = useCountry();
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);

  useEffect(() => {
    api.get<Category[]>(`/categories?country=${countryCode}`).then(setCategories).catch(() => setCategories([]));
    api
      .get<Paginated<ProviderProfile>>(`/providers?sort=rating&limit=6&country=${countryCode}`)
      .then((res) => setProviders(res.items))
      .catch(() => setProviders([]));
  }, [countryCode]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          {countries.length > 0 && (
            <Select
              value={countryCode}
              onChange={setCountryCode}
              options={countries.map((c) => ({ label: c.name, value: c.code }))}
            />
          )}
          <Text style={styles.hero}>Trouvez le bon prestataire, près de chez vous</Text>
          <Pressable style={styles.searchCta} onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.searchCtaText}>🔍 Rechercher un service...</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Catégories populaires</Text>
        </View>
      }
      data={categories}
      keyExtractor={(c) => c.id}
      numColumns={2}
      columnWrapperStyle={styles.categoryRow}
      renderItem={({ item }) => (
        <Pressable
          style={styles.categoryCard}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: item.id } })}
        >
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryMeta}>{item.children?.length ?? 0} sous-catégories</Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <Text style={styles.sectionTitle}>Prestataires les mieux notés</Text>
          {providers.map((p) => (
            <Pressable key={p.id} style={styles.providerCard} onPress={() => router.push(`/providers/${p.id}`)}>
              <Text style={styles.providerName}>
                {p.companyName || `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`}
              </Text>
              <Text style={styles.providerMeta}>
                {p.category?.name} · ⭐ {p.avgRating || '—'} ({p.reviewsCount})
              </Text>
            </Pressable>
          ))}
          {providers.length === 0 && <Text style={styles.empty}>Aucun prestataire pour le moment.</Text>}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 12, marginBottom: 12 },
  hero: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 8 },
  searchCta: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 14,
  },
  searchCtaText: { color: Brand.muted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  categoryRow: { gap: 10 },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  categoryName: { fontWeight: '600', color: '#111827' },
  categoryMeta: { fontSize: 12, color: Brand.muted, marginTop: 4 },
  footer: { gap: 10, marginTop: 8 },
  providerCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    padding: 14,
  },
  providerName: { fontWeight: '600', color: '#111827' },
  providerMeta: { fontSize: 12, color: Brand.muted, marginTop: 4 },
  empty: { color: Brand.muted, fontSize: 13 },
});
