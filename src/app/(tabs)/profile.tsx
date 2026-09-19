import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useCountry } from '@/lib/country-context';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, ErrorText, SuccessText } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const { countries } = useCountry();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', city: '', countryCode: 'TN' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      city: user.city || '',
      countryCode: user.countryCode || 'TN',
    });
  }, [user]);

  async function save() {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      await refresh();
      setMessage('Profil mis à jour.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mon profil</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{user.role === 'provider' ? 'Prestataire' : user.role === 'admin' ? 'Admin' : 'Client'}</Text>
      </View>

      <View style={styles.form}>
        <ErrorText>{error}</ErrorText>
        <SuccessText>{message}</SuccessText>
        <Field label="Prénom" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
        <Field label="Nom" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
        <Field label="Téléphone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Field label="Ville" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
        {countries.length > 0 && (
          <Select
            label="Pays"
            value={form.countryCode}
            onChange={(v) => setForm({ ...form, countryCode: v })}
            options={countries.map((c) => ({ label: c.name, value: c.code }))}
          />
        )}
        <Button title={saving ? 'Enregistrement...' : 'Enregistrer'} onPress={save} loading={saving} />
      </View>

      <View style={styles.links}>
        {user.role === 'client' && (
          <>
            <MenuLink label="🎁  Fidélité & parrainage" onPress={() => router.push('/loyalty')} />
            <MenuLink label="🏷️  Promotions" onPress={() => router.push('/promotions')} />
          </>
        )}
        {user.role === 'provider' && (
          <>
            <MenuLink label="📄  Vérification & documents" onPress={() => router.push('/documents')} />
            <MenuLink label="⭐  Abonnement" onPress={() => router.push('/subscription')} />
          </>
        )}
      </View>

      <Button title="Déconnexion" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}

function MenuLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuLink} onPress={onPress}>
      <Text style={styles.menuLinkText}>{label}</Text>
      <Text style={styles.menuLinkChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  badge: { alignSelf: 'flex-start', backgroundColor: Brand.successBackground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: Brand.primaryDark, fontWeight: '600', fontSize: 12 },
  form: { gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Brand.border },
  links: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: Brand.border, overflow: 'hidden' },
  menuLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  menuLinkText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  menuLinkChevron: { color: Brand.muted, fontSize: 18 },
});
