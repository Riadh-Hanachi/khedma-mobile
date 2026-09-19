import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Brand } from '@/constants/theme';

interface FieldProps extends TextInputProps {
  label?: string;
}

export function Field({ label, style, ...props }: FieldProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor="#9CA3AF" style={[styles.input, style]} {...props} />
    </View>
  );
}

export function ErrorText({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function SuccessText({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return <Text style={styles.success}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, color: Brand.muted, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  error: {
    color: Brand.danger,
    backgroundColor: Brand.dangerBackground,
    padding: 8,
    borderRadius: 8,
    fontSize: 13,
  },
  success: {
    color: Brand.primaryDark,
    backgroundColor: Brand.successBackground,
    padding: 8,
    borderRadius: 8,
    fontSize: 13,
  },
});
