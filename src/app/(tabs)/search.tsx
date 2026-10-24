import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { formatRating } from '@/lib/format';
import { api } from '@/lib/api';
import { useCountry } from '@/lib/country-context';
import { Category, Paginated, ProviderProfile } from '@/lib/types';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const { countryCode } = useCountry();
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState(params.categoryId || '');

  useEffect(() => {
    setCategoryId(params.categoryId || '');
  }, [params.categoryId]);

  useEffect(() => {
    api.get<Category[]>(`/categories/flat?country=${countryCode}`).then(setCategories).catch(() => setCategories([]));
  }, [countryCode]);

  useEffect(() => {
    setLoading(true);
    const search = new URLSearchParams();
    if (city) search.set('city', city);
    if (categoryId) search.set('categoryId', categoryId);
    search.set('country', countryCode);
    api
      .get<Paginated<ProviderProfile>>(`/providers?${search.toString()}`)
      .then((res) => setProviders(res.items))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [city, categoryId, countryCode]);

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <Select
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Toutes les catégories"
          options={categories.map((c) => ({ label: c.parentId ? `— ${c.name}` : c.name, value: c.id }))}
        />
        <Field placeholder="Ville" value={city} onChangeText={setCity} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Brand.primary} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={providers}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/providers/${item.id}`)}>
              <Text style={styles.name}>
                {item.companyName || `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`}
              </Text>
              <Text style={styles.meta}>
                {item.category?.name} · {formatRating(item.avgRating, item.reviewsCount, true)}
              </Text>
              <Text style={styles.meta}>{item.user?.city}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucun résultat pour ces critères.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  filters: { padding: 16, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Brand.border },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14 },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: Brand.muted, marginTop: 4 },
  empty: { color: Brand.muted, fontSize: 13, textAlign: 'center', marginTop: 24 },
});
