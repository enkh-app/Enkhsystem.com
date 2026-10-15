import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { fetch as expoFetch } from 'expo/fetch';
import * as Crypto from 'expo-crypto';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileAccessToken, mobileAccountKey } from '../mobile/auth.native';
import { resolveMobileChatApiBase } from '../mobile/chat-api';
import { createPeopleChatApi, PeopleMessage, PeopleThread } from '../mobile/people-chat-api';

export default function PeopleChatScreen() {
  const [self, setSelf] = useState('');
  const [threads, setThreads] = useState<PeopleThread[]>([]);
  const [messages, setMessages] = useState<PeopleMessage[]>([]);
  const [selected, setSelected] = useState('');
  const [recipient, setRecipient] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const session = useRef(0);
  const pendingSend = useRef<{ thread: string; content: string; id: string } | null>(null);
  const api = createPeopleChatApi(mobileAccessToken, expoFetch,
    resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_API_URL));

  const refresh = async (thread = selected, generation = session.current) => {
    const [accountId, list] = await Promise.all([api.me(), api.threads()]);
    if (generation !== session.current) return;
    setSelf(accountId); setThreads(list);
    if (thread) {
      const next = await api.messages(thread);
      if (generation === session.current) setMessages(next);
    }
  };
  useFocusEffect(useCallback(() => {
    let active = true;
    const generation = ++session.current;
    setSelf(''); setThreads([]); setMessages([]); setSelected('');
    void (async () => {
      try {
        if (!await mobileAccountKey()) { if (active) setError('Эхлээд Би хэсэгт нэвтэрнэ үү.'); return; }
        if (active) await refresh('', generation);
      } catch { if (active) setError('Чат түр холбогдсонгүй.'); }
    })();
    return () => { active = false; session.current += 1; pendingSend.current = null;
      setSelf(''); setThreads([]); setMessages([]); setSelected(''); };
  }, []));

  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); } catch { setError('Үйлдэл амжилтгүй боллоо. Дахин оролдоно уу.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.page}>
    <View style={styles.top}><Pressable accessibilityRole="button" onPress={() => router.back()}>
      <Text style={styles.link}>‹ Буцах</Text></Pressable><Text style={styles.title}>Хүмүүсийн чат</Text></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.help}>Өөрийн ID-г танилдаа дамжуулаад, түүний ID-г оруулж чат эхлүүлнэ.</Text>
      {self ? <Text selectable style={styles.id}>Миний ID: {self}</Text> : null}
      <TextInput accessibilityLabel="Танилын ID" value={recipient} onChangeText={setRecipient}
        autoCapitalize="none" placeholder="Танилын ID" style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !self} style={styles.button}
        onPress={() => void run(async () => { const thread = await api.start(recipient.trim().toLowerCase());
          setSelected(thread); setRecipient(''); await refresh(thread); })}>
        <Text style={styles.buttonText}>Чат эхлүүлэх</Text></Pressable>
      <Text style={styles.section}>Ярианууд</Text>
      {threads.map((thread) => <Pressable key={thread.id} accessibilityRole="button"
        onPress={() => void run(async () => { setSelected(thread.id); setMessages(await api.messages(thread.id)); })}
        style={styles.row}><Text style={styles.link}>{thread.peerName || thread.peerId}</Text></Pressable>)}
      {selected ? <>
        <Text style={styles.section}>Мессеж</Text>
        {messages.map((item) => <View key={item.id} style={styles.row}>
          <Text>{item.senderId === self ? 'Та' : 'Танил'}: {item.content}</Text></View>)}
        <TextInput accessibilityLabel="Мессеж" value={draft} onChangeText={setDraft}
          multiline maxLength={4000} placeholder="Мессеж бичнэ үү" style={styles.input} />
        <Pressable accessibilityRole="button" disabled={busy || !draft.trim()} style={styles.button}
          onPress={() => void run(async () => {
            const content = draft.trim();
            if (!pendingSend.current || pendingSend.current.thread !== selected || pendingSend.current.content !== content)
              pendingSend.current = { thread: selected, content, id: Crypto.randomUUID() };
            await api.send(selected, pendingSend.current.id, content);
            pendingSend.current = null; setDraft(''); await refresh(selected);
          })}><Text style={styles.buttonText}>Илгээх</Text></Pressable>
      </> : null}
      {busy ? <ActivityIndicator /> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7FA' },
  top: { padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  title: { fontSize: 21, fontWeight: '800', color: '#102A43' },
  link: { color: '#2159C9', fontWeight: '700' },
  content: { padding: 20, gap: 12 },
  help: { color: '#526579', lineHeight: 20 },
  id: { color: '#102A43', padding: 12, backgroundColor: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: '#CAD7E5', backgroundColor: '#FFFFFF', borderRadius: 10,
    padding: 12, minHeight: 48, color: '#102A43' },
  button: { backgroundColor: '#2F6FE4', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  section: { marginTop: 14, color: '#102A43', fontSize: 18, fontWeight: '800' },
  row: { padding: 14, borderRadius: 10, backgroundColor: '#FFFFFF' },
  error: { color: '#9A3412' },
});
