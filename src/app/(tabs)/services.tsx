import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCurrencySymbol } from '@/lib/country-context';
import { Category, ServiceOffering } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, ErrorText } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function ServicesScreen() {
  const { user } = useAuth();
  const currencySymbol = useCurrencySymbol(user?.countryCode);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', priceUnit: 'forfait', categoryId: '' });

  const load = useCallback((pid: string) => {
    api.get<{ items: ServiceOffering[] }>(`/services?providerId=${pid}`).then((res) => setServices(res.items));
  }, []);

  useFocusEffect(
    useCallback(() => {
      api.get<{ id: string }>('/providers/me').then((p) => {
        setProviderId(p.id);
        load(p.id);
      });
    }, [load]),
  );

  useEffect(() => {
    api.get<Category[]>('/categories/flat').then(setCategories).catch(() => setCategories([]));
  }, []);

  async function createService() {
    setError(null);
    try {
      await api.post('/services', { ...form, price: Number(form.price) });
      setForm({ title: '', description: '', price: '', priceUnit: 'forfait', categoryId: '' });
      if (providerId) load(providerId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de créer le service');
    }
  }

  async function toggleActive(service: ServiceOffering) {
    await api.patch(`/services/${service.id}`, { active: !service.active });
    if (providerId) load(providerId);
  }

  async function removeService(service: ServiceOffering) {
    await api.delete(`/services/${service.id}`);
    if (providerId) load(providerId);
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={services}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Ajouter un service</Text>
          <ErrorText>{error}</ErrorText>
          <Field placeholder="Titre du service" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Field placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={2} />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field placeholder={`Prix (${currencySymbol})`} value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />
            </View>
            <View style={styles.flex1}>
              <Select
                value={form.priceUnit}
                onChange={(v) => setForm({ ...form, priceUnit: v })}
                options={[
                  { label: 'Forfait', value: 'forfait' },
                  { label: 'Par heure', value: 'heure' },
                  { label: 'Par m²', value: 'm2' },
                  { label: 'Par jour', value: 'jour' },
                ]}
              />
            </View>
          </View>
          <Select
            value={form.categoryId}
            onChange={(v) => setForm({ ...form, categoryId: v })}
            placeholder="Catégorie"
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Button title="Ajouter" onPress={createService} disabled={!form.title || !form.price} />
          <Text style={styles.sectionTitle}>Mes services</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.muted}>
              {item.price} {item.currency} / {item.priceUnit} {!item.active ? '· désactivé' : ''}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <Button title={item.active ? 'Désactiver' : 'Activer'} variant="outline" onPress={() => toggleActive(item)} />
            <Button title="Supprimer" variant="danger" onPress={() => removeService(item)} />
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.muted}>Aucun service publié.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  form: { gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Brand.border, marginBottom: 16 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 10, marginBottom: 10 },
  cardTitle: { fontWeight: '600', color: '#111827' },
  muted: { color: Brand.muted, fontSize: 13, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
});
