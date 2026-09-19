import { StyleSheet, Text, View } from 'react-native';

const LABELS: Record<string, string> = {
  open: 'Ouverte',
  quoted: 'Devis reçus',
  accepted: 'Acceptée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  pending: 'En attente',
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  disputed: 'Litige',
  rejected: 'Refusé',
  expired: 'Expiré',
};

const COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#DBEAFE', text: '#1D4ED8' },
  quoted: { bg: '#FEF3C7', text: '#B45309' },
  accepted: { bg: '#D1FAE5', text: '#047857' },
  completed: { bg: '#D1FAE5', text: '#047857' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
  pending: { bg: '#FEF3C7', text: '#B45309' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  in_progress: { bg: '#E0E7FF', text: '#4338CA' },
  disputed: { bg: '#FEE2E2', text: '#B91C1C' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  expired: { bg: '#F3F4F6', text: '#6B7280' },
};

export function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] || COLORS.expired;
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{LABELS[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, fontWeight: '600' },
});
