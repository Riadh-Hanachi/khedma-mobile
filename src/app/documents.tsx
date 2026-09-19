import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { api, ApiError, fileUrl } from '@/lib/api';
import { DocumentType, ProviderDocument } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, ErrorText } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Brand } from '@/constants/theme';

const TYPE_LABELS: Record<DocumentType, string> = {
  id_card: "Carte d'identité",
  professional_license: 'Carte professionnelle / registre de commerce',
  insurance: "Attestation d'assurance",
  other: 'Autre document',
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [type, setType] = useState<DocumentType>('id_card');
  const [label, setLabel] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<ProviderDocument[]>('/documents/mine').then(setDocuments).catch(() => setDocuments([]));
  }, []);

  useFocusEffect(load);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled && result.assets?.[0]) setPickedFile(result.assets[0]);
  }

  async function handleUpload() {
    setError(null);
    if (!pickedFile) {
      setError('Choisissez un fichier');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await api.upload<{ url: string }>('/uploads', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
      });
      await api.post('/documents', { type, fileUrl: uploaded.url, label });
      setLabel('');
      setPickedFile(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'envoyer le document");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Vérification & documents' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Envoyez vos documents pour obtenir un badge de vérification. Un membre de l&apos;équipe Khedma les examine manuellement.
        </Text>

        <View style={styles.form}>
          <ErrorText>{error}</ErrorText>
          <Select
            label="Type de document"
            value={type}
            onChange={(v) => setType(v as DocumentType)}
            options={Object.entries(TYPE_LABELS).map(([value, l]) => ({ label: l, value }))}
          />
          <Field label="Précision (optionnel)" value={label} onChangeText={setLabel} />
          <Button title={pickedFile ? pickedFile.name : 'Choisir un fichier'} variant="outline" onPress={pickFile} />
          <Button title={uploading ? 'Envoi...' : 'Envoyer'} onPress={handleUpload} loading={uploading} disabled={!pickedFile} />
        </View>

        <View style={styles.section}>
          {documents.map((d) => (
            <View key={d.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.docType}>{TYPE_LABELS[d.type]}</Text>
                  {d.label && <Text style={styles.muted}>{d.label}</Text>}
                  <Text style={styles.link} onPress={() => Linking.openURL(fileUrl(d.fileUrl) || '')}>
                    Voir le fichier
                  </Text>
                </View>
                <StatusBadge status={d.status} />
              </View>
              {d.reviewNote && <Text style={styles.reviewNote}>{d.reviewNote}</Text>}
            </View>
          ))}
          {documents.length === 0 && <Text style={styles.muted}>Aucun document envoyé pour le moment.</Text>}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  flex1: { flex: 1 },
  hint: { color: Brand.muted, fontSize: 13 },
  form: { gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Brand.border },
  section: { gap: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  docType: { fontWeight: '600', color: '#111827' },
  muted: { color: Brand.muted, fontSize: 13 },
  link: { color: Brand.primaryDark, fontSize: 13, marginTop: 2 },
  reviewNote: { fontSize: 13, color: Brand.muted, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
});
