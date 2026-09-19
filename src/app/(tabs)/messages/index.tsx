import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Conversation } from '@/lib/types';
import { Brand } from '@/constants/theme';

export default function ConversationsScreen() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get<Conversation[]>('/conversations').then(setConversations).catch(() => setConversations([]));
    }, []),
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={conversations}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => {
        const name = isProvider
          ? `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`
          : item.provider?.companyName || `${item.provider?.user?.firstName ?? ''} ${item.provider?.user?.lastName ?? ''}`;
        return (
          <Pressable style={styles.card} onPress={() => router.push(`/(tabs)/messages/${item.id}`)}>
            <Text style={styles.name}>{name || 'Utilisateur'}</Text>
            {item.lastMessagePreview && <Text style={styles.preview} numberOfLines={1}>{item.lastMessagePreview}</Text>}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune conversation pour le moment.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.screenBackground },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, padding: 14 },
  name: { fontWeight: '600', color: '#111827' },
  preview: { color: Brand.muted, fontSize: 13, marginTop: 4 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: Brand.muted },
});
