import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { fetch as expoFetch } from 'expo/fetch';
import { AppHeader } from './app-header.native';
import { useI18n } from '../i18n';
import { mobileAccountKey, mobileAccessToken, mobileProfile } from '../mobile/auth.native';
import { createGuestMobileChatApi, createMobileChatApi, resolveMobileChatApiBase } from '../mobile/chat-api';
import { claimMobileGuestChat, mobileGuestAccountKey, mobileGuestToken } from '../mobile/guest-chat.native';
import { MobileChatEngine, LocalChatState } from '../mobile/chat-engine';
import { nativeChatPersistence } from '../mobile/chat-storage.native';

const empty: LocalChatState = { cursor: 0, conversations: [], messages: [], pendingTurns: [], pendingDeletes: [] };

type NativeChatScreenProps = { homeMode?: boolean };

export default function NativeChatScreen({ homeMode = false }: NativeChatScreenProps) {
  const { t } = useI18n();
  const [account, setAccount] = useState<string | null>(null);
  const [state, setState] = useState<LocalChatState>(empty);
  const [conversation, setConversation] = useState('');
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [greetingName, setGreetingName] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const engine = useRef<MobileChatEngine | null>(null);

  useEffect(() => {
    let active = true;
    void mobileProfile()
      .then((profile) => { if (active) setGreetingName(profile.greetingName); })
      .catch(() => { /* Greeting remains safely generic. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setWorking(true);
    void (async () => {
      try {
        const apiBase = resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_CHAT_API_URL);
        const clientType = Platform.OS === 'android' ? 'android' : 'ios';
        const signedInKey = await mobileAccountKey();
        if (signedInKey) {
          try { await claimMobileGuestChat(mobileAccessToken, expoFetch, apiBase, clientType); }
          catch { /* Keep the SecureStore guest token and retry transfer on the next Chat startup. */ }
        }
        const client = signedInKey
          ? createMobileChatApi(mobileAccessToken, expoFetch, apiBase, clientType)
          : createGuestMobileChatApi(() => mobileGuestToken(expoFetch, apiBase, clientType),
            expoFetch, apiBase, clientType);
        const instance = new MobileChatEngine(nativeChatPersistence, client, Crypto.randomUUID,
          (next) => { if (active) setState(next); });
        engine.current = instance;
        const key = signedInKey || mobileGuestAccountKey;
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

  const newChat = () => { setConversation(Crypto.randomUUID()); setHistoryOpen(false); setNotice(''); };
  const send = async () => {
    const text = input.trim();
    if (!text || working) return;
    if (!account) {
      setNotice('Үргэлжлүүлэхийн тулд Би хэсгээс нэвтэрнэ үү.');
      return;
    }
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

  const conversations = state.conversations.filter((item) => !item.deleted);
  const visible = state.messages.filter((message) => message.clientConversationId === conversation &&
    !state.conversations.find((item) => item.id === conversation)?.deleted);
  const pending = state.pendingTurns.length + state.pendingDeletes.length;
  const conversationTitle = (id: string, index: number) =>
    state.messages.find((message) => message.clientConversationId === id && message.role === 'user')?.content.trim() || `Яриа ${index + 1}`;

  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active={homeMode ? 'home' : 'chat'}
      onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
      onHistory={account ? () => setHistoryOpen((current) => !current) : undefined}
      onNewChat={account ? newChat : undefined} />
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {historyOpen && account ? <View style={styles.historyPanel}>
          <Text accessibilityRole="header" style={styles.historyTitle}>Ярианы түүх</Text>
          <ScrollView style={styles.historyList} contentContainerStyle={styles.historyContent}>
            {conversations.length ? conversations.map((item, index) => <Pressable key={item.id}
              accessibilityRole="button" accessibilityState={{ selected: item.id === conversation }}
              onPress={() => { setConversation(item.id); setHistoryOpen(false); }}
              style={[styles.historyItem, item.id === conversation && styles.historyItemSelected]}>
              <Text numberOfLines={1} style={styles.historyItemText}>{conversationTitle(item.id, index)}</Text>
            </Pressable>) : <Text style={styles.help}>Өмнөх яриа алга.</Text>}
          </ScrollView>
        </View> : <>
          <ScrollView style={styles.messages}
            contentContainerStyle={[styles.messageContent, visible.length === 0 && styles.emptyContent]}
            keyboardShouldPersistTaps="handled">
            {visible.length === 0 ? <View style={styles.emptyState}>
              {homeMode ? <Text style={styles.hello}>{greetingName ? `Сайн байна уу, ${greetingName}.` : 'Сайн байна уу, Nasa.'}</Text> : null}
              <Text accessibilityRole="header" style={styles.emptyTitle}>Энхтэй ярилцах</Text>
              <Text style={styles.help}>{t('chat.empty')}</Text>
            </View> : null}
            {visible.map((message) => <View key={message.id}
              style={[styles.messageShell, message.role === 'user' ? styles.userShell : styles.assistantShell]}>
              <View style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}>
                <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>{message.content}</Text>
              </View>
              {message.status !== 'sent' ? <Pressable accessibilityRole={message.status === 'failed' ? 'button' : undefined}
                accessibilityLabel={message.status === 'failed' ? 'Мессежийг дахин илгээх' : undefined}
                disabled={message.status !== 'failed' || working} onPress={() => void retry()}>
                <Text style={[styles.pending, message.role === 'user' && styles.pendingUser]}>
                  {message.status === 'failed' ? 'Илгээгдээгүй · Дахин оролдох' : 'Хүлээгдэж байна'}
                </Text>
              </Pressable> : null}
            </View>)}
            {working ? <ActivityIndicator /> : null}
          </ScrollView>
          {pending ? <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.retry}>
            <Text style={styles.retryText}>Хүлээгдэж буй {pending} · Дахин оролдох</Text>
          </Pressable> : null}
          {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
          <View style={styles.composer}>
            <Pressable accessibilityRole="button" accessibilityLabel="Дуу оруулах (удахгүй)" disabled
              style={styles.micButton}><Text style={styles.micIcon}>⌁</Text></Pressable>
            <TextInput multiline value={input} onChangeText={setInput} accessibilityLabel={t('chat.placeholder')}
              placeholder={t('chat.placeholder')} returnKeyType="default" style={styles.input} />
            <Pressable accessibilityRole="button" disabled={!input.trim() || working}
              onPress={() => void send()} style={[styles.sendButton, (!input.trim() || working) && styles.buttonDisabled]}>
              <Text style={styles.buttonText}>{t('chat.send')}</Text>
            </Pressable>
          </View>
        </>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  layout: { flex: 1, minHeight: 0, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6, gap: 6 },
  messages: { flex: 1, minHeight: 0, backgroundColor: '#EAF2FA', borderRadius: 16 },
  messageContent: { padding: 12, gap: 10 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, gap: 7 },
  hello: { color: '#7C90A8', fontSize: 14, lineHeight: 20 },
  emptyTitle: { color: '#0B1F33', fontSize: 25, lineHeight: 32, fontWeight: '900', textAlign: 'center' },
  help: { color: '#627D98', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  messageShell: { maxWidth: '85%', gap: 3 },
  userShell: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  assistantShell: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 15 },
  user: { backgroundColor: '#0B57D0', borderBottomRightRadius: 5 },
  assistant: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#DFE8F3' },
  userText: { color: '#FFF', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#243B53', fontSize: 15, lineHeight: 22 },
  pending: { color: '#627D98', fontSize: 11, lineHeight: 15, paddingHorizontal: 4 },
  pendingUser: { textAlign: 'right' },
  historyPanel: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFE8F3' },
  historyTitle: { color: '#102A43', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  historyList: { flex: 1 },
  historyContent: { gap: 7, paddingBottom: 10 },
  historyItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#F5F8FC' },
  historyItemSelected: { backgroundColor: '#E5EFFF', borderWidth: 1, borderColor: '#B9D1F7' },
  historyItemText: { color: '#243B53', fontSize: 14, fontWeight: '700' },
  retry: { minHeight: 34, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10,
    borderRadius: 11, backgroundColor: '#FFFFFF' },
  retryText: { color: '#49637F', fontSize: 13, fontWeight: '700' },
  notice: { maxHeight: 54, color: '#744139', paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: '#FFF4F2', borderRadius: 9, fontSize: 12, lineHeight: 17 },
  composer: { flexShrink: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 6, backgroundColor: '#FFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#DFE8F3' },
  micButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    backgroundColor: '#F1F5FA' },
  micIcon: { color: '#829AB1', fontSize: 24, lineHeight: 26, fontWeight: '700' },
  input: { flex: 1, minHeight: 42, maxHeight: 104, paddingHorizontal: 8, paddingVertical: 9,
    color: '#102A43', fontSize: 15, lineHeight: 20, textAlignVertical: 'top' },
  sendButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15,
    backgroundColor: '#0B57D0', borderRadius: 12 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#FFF', fontWeight: '800' },
});
