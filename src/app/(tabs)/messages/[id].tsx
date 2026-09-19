import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import { api, getToken, SOCKET_BASE } from '@/lib/api';
import { Message } from '@/lib/types';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  function addMessage(message: Message) {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .get<Message[]>(`/conversations/${id}/messages`)
        .then((res) => active && setMessages(res))
        .catch(() => {});

      let socket: Socket | undefined;
      getToken().then((token) => {
        if (!active) return;
        socket = io(SOCKET_BASE, { auth: { token }, transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('join', id);
        socket.on('message', (message: Message) => {
          if (message.conversationId === id) addMessage(message);
        });
      });

      return () => {
        active = false;
        socket?.emit('leave', id);
        socket?.disconnect();
      };
    }, [id]),
  );

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const message = await api.post<Message>(`/conversations/${id}/messages`, { content });
      addMessage(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        style={styles.screen}
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.content}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Aucun message. Dites bonjour !</Text>}
      />
      <View style={styles.inputRow}>
        <View style={styles.flex1}>
          <Field placeholder="Votre message..." value={text} onChangeText={setText} />
        </View>
        <Button title="Envoyer" onPress={send} disabled={!text.trim() || sending} loading={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.screenBackground },
  flex1: { flex: 1 },
  screen: { flex: 1 },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: { color: Brand.muted, textAlign: 'center', marginTop: 24 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: Brand.primary },
  bubbleTheirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: Brand.border },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#111827' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Brand.border, alignItems: 'center' },
});
