import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, ErrorText } from '@/components/ui/field';
import { Brand } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Khedma</Text>
        <Text style={styles.title}>Connexion</Text>

        <View style={styles.form}>
          <ErrorText>{error}</ErrorText>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="vous@exemple.com"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button title={loading ? 'Connexion...' : 'Se connecter'} onPress={handleSubmit} loading={loading} disabled={!email || !password} />
        </View>

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>Pas encore de compte ? S&apos;inscrire</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.screenBackground },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: Brand.primaryDark, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#111827' },
  form: { gap: 14, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Brand.border },
  link: { alignSelf: 'center', marginTop: 8 },
  linkText: { color: Brand.primaryDark, fontWeight: '500', fontSize: 14 },
});
