import { useEffect, useState } from 'react';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCurrencySymbol } from '@/lib/country-context';
import { Category, ParsedRequest, ServiceRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, ErrorText, SuccessText } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

export default function NewRequestScreen() {
  const { user } = useAuth();
  const { ref: scrollRef, scrollToTop } = useScrollToTop();
  const currencySymbol = useCurrencySymbol(user?.countryCode);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    city: '',
    addressLine: '',
    urgent: false,
    budget: '',
  });

  useEffect(() => {
    api.get<Category[]>('/categories/flat').then(setCategories).catch(() => setCategories([]));
  }, []);

  async function handleAiAnalyze() {
    setAiError(null);
    setAiLoading(true);
    try {
      const parsed = await api.post<ParsedRequest>('/ai/parse-request', { text: aiText });
      setForm((f) => ({
        ...f,
        title: parsed.title || f.title,
        description: parsed.description || f.description,
        categoryId: parsed.categoryId || f.categoryId,
        city: parsed.city || f.city,
        urgent: parsed.urgent,
        budget: parsed.budget ? String(parsed.budget) : f.budget,
      }));
      setAiApplied(true);
    } catch (e) {
      setAiError(e instanceof ApiError ? e.message : "Impossible d'analyser cette demande");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const request = await api.post<ServiceRequest>('/requests', {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      router.replace(`/(tabs)/requests/${request.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de publier la demande');
      scrollToTop();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.aiBox}>
          <Text style={styles.aiTitle}>✨ Assistant IA</Text>
          <Text style={styles.aiHint}>Décrivez votre besoin en une phrase, l&apos;assistant pré-remplit le formulaire.</Text>
          {aiError && <ErrorText>{aiError}</ErrorText>}
          {aiApplied && !aiError && <SuccessText>Formulaire pré-rempli, vérifiez avant de publier.</SuccessText>}
          <Field
            placeholder="Ex : fuite d'eau à Ariana, besoin de quelqu'un aujourd'hui"
            value={aiText}
            onChangeText={setAiText}
          />
          <Button title={aiLoading ? 'Analyse...' : 'Analyser'} onPress={handleAiAnalyze} loading={aiLoading} disabled={!aiText} variant="outline" />
        </View>

        <View style={styles.form}>
          <ErrorText>{error}</ErrorText>
          <Field label="Titre" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <Select
            label="Catégorie"
            value={form.categoryId}
            onChange={(v) => setForm({ ...form, categoryId: v })}
            placeholder="Choisissez une catégorie"
            options={categories.map((c) => ({ label: c.parentId ? `— ${c.name}` : c.name, value: c.id }))}
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            numberOfLines={4}
          />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field label="Ville" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            </View>
            <View style={styles.flex1}>
              <Field
                label={`Budget (${currencySymbol}, optionnel)`}
                value={form.budget}
                onChangeText={(v) => setForm({ ...form, budget: v })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Field label="Adresse précise (optionnel)" value={form.addressLine} onChangeText={(v) => setForm({ ...form, addressLine: v })} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Besoin urgent (aujourd&apos;hui)</Text>
            <Switch value={form.urgent} onValueChange={(v) => setForm({ ...form, urgent: v })} trackColor={{ true: Brand.primary }} />
          </View>

          <Button
            title={loading ? 'Publication...' : 'Publier la demande'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!form.title || !form.categoryId || !form.description || !form.city}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.screenBackground },
  flex1: { flex: 1 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  aiBox: { backgroundColor: Brand.successBackground, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#A7F3D0' },
  aiTitle: { fontWeight: '700', color: Brand.primaryDark },
  aiHint: { fontSize: 13, color: '#065F46' },
  form: { gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Brand.border },
  row: { flexDirection: 'row', gap: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { color: '#374151', fontSize: 14 },
});
