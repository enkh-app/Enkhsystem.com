import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sendMessage } from '../api';
import { AppHeader } from '../components/app-header';

type Message = { id: number; text: string; from: 'user' | 'enkh' };

export default function ChatScreen() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const initialPrompt = typeof prompt === 'string' ? prompt : '';
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Сайн байна уу. Би ENKH AI. Танд юугаар туслах вэ?', from: 'enkh' },
  ]);
  const scrollRef = useRef<ScrollView>(null);
  const initialSent = useRef(false);

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { id: Date.now(), text, from: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(text);
      const answer = response.answer || response.message || response.response || response.content;
      if (!answer?.trim()) throw new Error('Empty AI answer');
      setMessages((current) => [...current, { id: Date.now() + 1, text: answer.trim(), from: 'enkh' }]);
    } catch {
      setMessages((current) => [...current, { id: Date.now() + 1, text: 'ENKH API-тай холбогдоход алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.', from: 'enkh' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !initialSent.current) {
      initialSent.current = true;
      void send(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="chat" />
      <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>ENKH Chat</Text>
          <Text style={styles.subtitle}>Асуултаа Монгол хэлээр бичиж, AI-аас шууд хариулт аваарай.</Text>
        </View>
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
          {messages.map((message) => (
            <View key={message.id} style={[styles.row, message.from === 'user' ? styles.userRow : styles.enkhRow]}>
              <View style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.enkhBubble]}>
                <Text style={[styles.message, message.from === 'user' && styles.userMessage]}>{message.text}</Text>
              </View>
            </View>
          ))}
          {loading && <View accessibilityLiveRegion="polite" style={styles.thinking}><ActivityIndicator color="#171717" /><Text style={styles.thinkingText}>ENKH бодож байна…</Text></View>}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Chat асуулт"
            editable={!loading}
            multiline
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => void send()}
            placeholder="ENKH-ээс юм асуух…"
            placeholderTextColor="#888"
            style={styles.input}
            submitBehavior="submit"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Асуулт илгээх" disabled={!input.trim() || loading} onPress={() => void send()} style={({ pressed }) => [styles.send, (!input.trim() || loading) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.sendText}>Илгээх ↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F5' },
  layout: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  intro: { paddingTop: 24, paddingBottom: 18 },
  title: { fontSize: 30, fontWeight: '900', color: '#171717' },
  subtitle: { marginTop: 7, fontSize: 15, lineHeight: 22, color: '#707070' },
  messages: { flex: 1, borderRadius: 22, backgroundColor: '#F1F1EE' },
  messageContent: { padding: 18, gap: 16 },
  row: { maxWidth: '86%' },
  enkhRow: { alignSelf: 'flex-start' },
  userRow: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: 17, paddingVertical: 13, borderRadius: 18 },
  enkhBubble: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1DD' },
  userBubble: { backgroundColor: '#171717' },
  message: { fontSize: 16, lineHeight: 24, color: '#202020' },
  userMessage: { color: '#FFF' },
  thinking: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  thinkingText: { color: '#686868', fontSize: 14 },
  composer: { marginTop: 12, minHeight: 66, flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  input: { flex: 1, minHeight: 48, maxHeight: 140, paddingHorizontal: 12, paddingVertical: 12, color: '#171717', fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  send: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 17, borderRadius: 14, backgroundColor: '#171717' },
  sendText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.7 },
});
