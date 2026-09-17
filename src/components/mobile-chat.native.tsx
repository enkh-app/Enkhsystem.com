import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { AppHeader } from './app-header';
import { useI18n } from '../i18n';
import { mobileAccountKey, mobileAccessToken, mobileSignIn, mobileSignOut } from '../mobile/auth.native';
import { createMobileChatApi, resolveMobileChatApiBase } from '../mobile/chat-api';
import { MobileChatEngine, LocalChatState } from '../mobile/chat-engine';
import { nativeChatPersistence } from '../mobile/chat-storage.native';

const empty: LocalChatState = { cursor: 0, conversations: [], messages: [], pendingTurns: [], pendingDeletes: [] };

export default function NativeChatScreen() {
  const { t } = useI18n();
  const [account, setAccount] = useState<string | null>(null);
  const [state, setState] = useState<LocalChatState>(empty);
  const [conversation, setConversation] = useState('');
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const engine = useRef<MobileChatEngine | null>(null);

  useEffect(() => {
    let active = true;
    setWorking(true);
    void (async () => {
      try {
        const client = createMobileChatApi(mobileAccessToken, expoFetch,
          resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_CHAT_API_URL),
          Platform.OS === 'android' ? 'android' : 'ios');
        const instance = new MobileChatEngine(nativeChatPersistence, client, Crypto.randomUUID,
          (next) => { if (active) setState(next); });
        engine.current = instance;
        const key = await mobileAccountKey();
        if (!active) return;
        setAccount(key);
        await instance.switchAccount(key);
        if (!active || !key) return;
        const first = instance.view().conversations.find((item) => !item.deleted);
        setConversation(first?.id || Crypto.randomUUID());
        await instance.retryPending();
        await instance.retryDeletes();
        await instance.pull();
      } catch { if (active) setNotice('Chat-ийг ачаалах боломжгүй байна. Local өгөгдөл хэвээр.'); }
      finally { if (active) setWorking(false); }
    })();
    return () => { active = false; engine.current = null; };
  }, []);

  const signIn = async () => {
    setWorking(true); setNotice('');
    try {
      const key = await mobileSignIn();
      await engine.current?.switchAccount(key);
      setAccount(key); setConversation(Crypto.randomUUID());
      await engine.current?.pull();
    } catch { setNotice('Нэвтрэлт одоогоор боломжгүй байна. Тохиргоог шалгаад дахин оролдоно уу.'); }
    finally { setWorking(false); }
  };
  const signOut = async () => {
    setWorking(true); setNotice('');
    try { await mobileSignOut(); await engine.current?.switchAccount(null); setAccount(null); setConversation(''); }
    catch { setNotice('Гарах үйлдэл амжилтгүй боллоо.'); }
    finally { setWorking(false); }
  };
  const send = async () => {
    const text = input.trim();
    if (!text || !account || working) return;
    setInput(''); setWorking(true); setNotice('');
    try { await engine.current?.send(conversation || Crypto.randomUUID(), text); }
    catch { setNotice('Асуулт local-д хадгалагдсан эсэхийг шалгаад дахин оролдоно уу.'); }
    finally { setWorking(false); }
  };
  const retry = async () => {
    setWorking(true); setNotice('');
    try { await engine.current?.retryPending(); await engine.current?.retryDeletes(); await engine.current?.pull(); }
    catch { setNotice('Сүлжээ түр холбогдсонгүй. Local асуултууд хадгалагдсан.'); }
    finally { setWorking(false); }
  };
  const visible = state.messages.filter((message) => message.clientConversationId === conversation &&
    !state.conversations.find((item) => item.id === conversation)?.deleted);
  const pending = state.pendingTurns.length + state.pendingDeletes.length;

  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="chat" />
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('chat.title')}</Text>
        {account ? <Pressable accessibilityRole="button" onPress={() => setConversation(Crypto.randomUUID())} style={styles.control}><Text>{t('chat.new')}</Text></Pressable> : null}
      </View>
      {!account ? <View style={styles.prompt}><Text style={styles.help}>Chat-аа төхөөрөмж хооронд хадгалахын тулд нэвтэрнэ үү.</Text>
        <Pressable accessibilityRole="button" disabled={working} onPress={() => void signIn()} style={styles.button}><Text style={styles.buttonText}>Нэвтрэх</Text></Pressable></View> : <>
        {state.conversations.filter((item) => !item.deleted).length > 1 ? <ScrollView horizontal style={styles.tabs}>
          {state.conversations.filter((item) => !item.deleted).map((item, index) => <Pressable key={item.id}
            accessibilityRole="button" onPress={() => setConversation(item.id)} style={styles.control}>
            <Text>{index + 1}{item.id === conversation ? ' ✓' : ''}</Text></Pressable>)}</ScrollView> : null}
        <ScrollView style={styles.messages} contentContainerStyle={styles.messageContent}>
          {visible.length === 0 ? <Text style={styles.help}>{t('chat.empty')}</Text> : null}
          {visible.map((message) => <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}>
            <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>{message.content}</Text>
            {message.status !== 'sent' ? <Text style={styles.pending}>{message.status === 'failed' ? 'Илгээгдээгүй' : 'Хүлээгдэж байна'}</Text> : null}
          </View>)}
          {working ? <ActivityIndicator /> : null}
        </ScrollView>
        {pending ? <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.control}>
          <Text>Хүлээгдэж буй {pending} · Дахин оролдох</Text></Pressable> : null}
        <View style={styles.composer}><TextInput multiline value={input} onChangeText={setInput}
          accessibilityLabel={t('chat.placeholder')} placeholder={t('chat.placeholder')}
          style={styles.input} /><Pressable accessibilityRole="button" disabled={!input.trim() || working}
          onPress={() => void send()} style={styles.button}><Text style={styles.buttonText}>{t('chat.send')}</Text></Pressable></View>
        <Pressable accessibilityRole="button" disabled={working} onPress={() => void signOut()} style={styles.signOut}><Text>Гарах</Text></Pressable>
      </>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' }, layout: { flex: 1, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '900', color: '#102A43' },
  control: { minHeight: 44, justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14 },
  tabs: { flexGrow: 0, maxHeight: 48 }, messages: { flex: 1, backgroundColor: '#EAF2FA', borderRadius: 20 },
  messageContent: { padding: 16, gap: 12 }, bubble: { maxWidth: '86%', padding: 14, borderRadius: 17 },
  user: { alignSelf: 'flex-end', backgroundColor: '#0B57D0' }, assistant: { alignSelf: 'flex-start', backgroundColor: '#FFF' },
  userText: { color: '#FFF', fontSize: 16, lineHeight: 24 }, assistantText: { color: '#243B53', fontSize: 16, lineHeight: 24 },
  pending: { color: '#D7E4F3', fontSize: 11, marginTop: 5 }, prompt: { gap: 14, marginTop: 20 },
  help: { color: '#627D98', fontSize: 14 }, button: { minHeight: 48, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 17, backgroundColor: '#0B57D0', borderRadius: 13 }, buttonText: { color: '#FFF', fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, backgroundColor: '#FFF', borderRadius: 18 },
  input: { flex: 1, minHeight: 46, maxHeight: 130, paddingHorizontal: 10, color: '#102A43' },
  signOut: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12 },
  notice: { color: '#744139', padding: 10, backgroundColor: '#FFF4F2', borderRadius: 10 },
});
