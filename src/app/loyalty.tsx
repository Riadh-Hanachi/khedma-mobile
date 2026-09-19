import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api, ApiError } from '@/lib/api';
import { LoyaltyAccount, LoyaltyTransaction, Referral } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Field, ErrorText, SuccessText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

const REASON_LABELS: Record<string, string> = {
  booking_completed: 'Réservation terminée',
  review_submitted: 'Avis laissé',
  referral_bonus: 'Parrainage réussi',
  redemption: 'Échange contre du crédit',
  admin_adjustment: 'Ajustement',
};

export default function LoyaltyScreen() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    api.get<LoyaltyAccount>('/loyalty/me').then(setAccount).catch(() => setAccount(null));
    api.get<LoyaltyTransaction[]>('/loyalty/transactions').then(setTransactions).catch(() => setTransactions([]));
    api.get<Referral[]>('/loyalty/referrals').then(setReferrals).catch(() => setReferrals([]));
  }, []);

  useFocusEffect(load);

  async function handleCopy() {
    if (!account) return;
    await Clipboard.setStringAsync(account.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRedeem() {
    setError(null);
    setMessage(null);
    try {
      await api.post('/loyalty/redeem', { points: Number(redeemPoints) });
      setMessage('Points échangés contre du crédit avec succès.');
      setRedeemPoints('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'échanger ces points");
    }
  }

  if (!account) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Fidélité & parrainage' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{account.loyaltyPoints}</Text>
            <Text style={styles.muted}>Points fidélité</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{account.creditBalance} {account.currencySymbol}</Text>
            <Text style={styles.muted}>Crédit disponible</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.muted}>Filleuls</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Comment gagner des points</Text>
          <Text style={styles.line}>+{account.rules.POINTS_PER_COMPLETED_BOOKING} points par réservation terminée</Text>
          <Text style={styles.line}>+{account.rules.POINTS_PER_REVIEW} points par avis laissé</Text>
          <Text style={styles.line}>+{account.rules.POINTS_PER_REFERRAL} points quand un filleul termine sa première prestation</Text>
          <Text style={styles.muted}>
            {account.rules.POINTS_PER_DT} points = 1 {account.currencySymbol} de crédit, échangeable par paliers de {account.rules.MIN_REDEEMABLE_POINTS} points.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Parrainer un proche</Text>
          <Text style={styles.line}>
            Partagez votre code : votre filleul crée un compte, et dès qu&apos;il termine sa première prestation, vous recevez {account.rules.POINTS_PER_REFERRAL} points.
          </Text>
          <View style={styles.row}>
            <Text style={styles.code}>{account.referralCode}</Text>
            <Button title={copied ? 'Copié !' : 'Copier'} onPress={handleCopy} variant="outline" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Échanger des points contre du crédit</Text>
          <ErrorText>{error}</ErrorText>
          <SuccessText>{message}</SuccessText>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field
                placeholder={`Multiple de ${account.rules.POINTS_PER_DT}, min. ${account.rules.MIN_REDEEMABLE_POINTS}`}
                value={redeemPoints}
                onChangeText={setRedeemPoints}
                keyboardType="numeric"
              />
            </View>
            <Button title="Échanger" onPress={handleRedeem} disabled={!redeemPoints} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes filleuls</Text>
          {referrals.map((r) => (
            <View key={r.id} style={styles.listRow}>
              <View style={styles.flex1}>
                <Text style={styles.line}>{r.referred?.firstName ?? 'Utilisateur'}</Text>
                <Text style={styles.muted}>Inscrit le {new Date(r.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.muted}>{r.rewardPoints} points</Text>
                <StatusBadge status={r.status} />
              </View>
            </View>
          ))}
          {referrals.length === 0 && <Text style={styles.muted}>Aucun filleul pour le moment.</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {transactions.map((t) => (
            <View key={t.id} style={styles.listRow}>
              <View style={styles.flex1}>
                <Text style={styles.line}>{REASON_LABELS[t.reason] || t.reason}</Text>
                {t.note && <Text style={styles.muted}>{t.note}</Text>}
              </View>
              <Text style={t.points >= 0 ? styles.positive : styles.negative}>
                {t.points >= 0 ? '+' : ''}
                {t.points}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && <Text style={styles.muted}>Aucune activité pour le moment.</Text>}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.screenBackground },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14, gap: 8 },
  section: { gap: 8 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  line: { color: '#374151', fontSize: 13 },
  muted: { color: Brand.muted, fontSize: 12 },
  code: { fontWeight: '700', fontSize: 16, color: Brand.primaryDark, flex: 1 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 12 },
  positive: { color: Brand.primaryDark, fontWeight: '600' },
  negative: { color: Brand.danger, fontWeight: '600' },
});
