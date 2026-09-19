import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useCountry } from '@/lib/country-context';
import { api, ApiError } from '@/lib/api';
import { Category, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, ErrorText } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { countries, countryCode: browsingCountryCode } = useCountry();
  const [role, setRole] = useState<UserRole>('client');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    companyName: '',
    categoryId: '',
    description: '',
    countryCode: browsingCountryCode,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, countryCode: browsingCountryCode }));
  }, [browsingCountryCode]);

  useEffect(() => {
    api
      .get<Category[]>(`/categories/flat?country=${form.countryCode}`)
      .then(setCategories)
      .catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.countryCode]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      router.replace(user.role === 'provider' ? '/(tabs)/services' : '/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>

        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole('client')}
            style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>Je suis client</Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('provider')}
            style={[styles.roleButton, role === 'provider' && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>Je suis prestataire</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <ErrorText>{error}</ErrorText>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field label="Prénom" value={form.firstName} onChangeText={(v) => set('firstName', v)} />
            </View>
            <View style={styles.flex1}>
              <Field label="Nom" value={form.lastName} onChangeText={(v) => set('lastName', v)} />
            </View>
          </View>
          <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Mot de passe" value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field label="Téléphone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            </View>
            <View style={styles.flex1}>
              <Field label="Ville" value={form.city} onChangeText={(v) => set('city', v)} />
            </View>
          </View>

          {countries.length > 0 && (
            <Select
              label="Pays"
              value={form.countryCode}
              onChange={(v) => set('countryCode', v)}
              options={countries.map((c) => ({ label: c.name, value: c.code }))}
            />
          )}

          {role === 'provider' && (
            <View style={styles.providerSection}>
              <Text style={styles.sectionLabel}>Informations professionnelles</Text>
              <Field
                label="Nom de l'entreprise (optionnel)"
                value={form.companyName}
                onChangeText={(v) => set('companyName', v)}
              />
              <Select
                label="Catégorie"
                value={form.categoryId}
                onChange={(v) => set('categoryId', v)}
                placeholder="Sélectionnez une catégorie"
                options={categories.map((c) => ({ label: c.parentId ? `— ${c.name}` : c.name, value: c.id }))}
              />
              <Field
                label="Décrivez votre activité"
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <Button
            title={loading ? 'Création du compte...' : 'Créer mon compte'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!form.email || !form.password || !form.firstName || !form.lastName}
          />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Déjà inscrit ? Se connecter</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.screenBackground },
  flex1: { flex: 1 },
  container: { flexGrow: 1, padding: 20, gap: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  roleText: { color: '#374151', fontWeight: '500' },
  roleTextActive: { color: '#fff' },
  form: { gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Brand.border },
  row: { flexDirection: 'row', gap: 10 },
  providerSection: { gap: 12, borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  link: { alignSelf: 'center', marginTop: 8, marginBottom: 24 },
  linkText: { color: Brand.primaryDark, fontWeight: '500', fontSize: 14 },
});
