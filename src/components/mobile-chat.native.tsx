import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { fetch as expoFetch } from 'expo/fetch';
import { AppHeader } from './app-header';
import { useI18n } from '../i18n';
import { mobileAccountKey, mobileAccessToken, mobileProfile, mobileSignIn, mobileSignOut } from '../mobile/auth.native';
import { formatMobileAuthDiagnostic } from '../mobile/auth-diagnostic';
import { createMobileChatApi, resolveMobileChatApiBase } from '../mobile/chat-api';
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
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [greetingName, setGreetingName] = useState<string | null>(null);
  const engine = useRef<MobileChatEngine | null>(null);
  const inputRef = useRef<TextInput>(null);
  const dictationPrefix = useRef('');
  const knownAssistantIds = useRef<Set<string> | null>(null);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) setInput(`${dictationPrefix.current}${transcript}`);
  });
  useSpeechRecognitionEvent('error', () => {
    setListening(false);
    setNotice('Яриаг таньж чадсангүй. Бичгээр оруулж эсвэл дахин оролдоно уу.');
  });

  useEffect(() => () => { void Speech.stop(); ExpoSpeechRecognitionModule.abort(); }, []);

  const toggleDictation = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      inputRef.current?.focus();
      return;
    }
    setNotice('');
    await Speech.stop(); setSpeakingId(null);
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setNotice('Микрофон болон яриа таних зөвшөөрлийг утасны Settings-ээс нээнэ үү.');
        return;
      }
      dictationPrefix.current = input.trim() ? `${input.trim()} ` : '';
      Keyboard.dismiss();
      ExpoSpeechRecognitionModule.start({ lang: 'mn-MN', interimResults: true, continuous: false });
    } catch { setNotice('Дуут бичлэг одоогоор боломжгүй байна.'); }
  };

  const toggleSpeech = async (id: string, content: string) => {
    await Speech.stop();
    if (speakingId === id) { setSpeakingId(null); return; }
    setSpeakingId(id);
    try {
      Speech.speak(content, { language: 'mn-MN',
        onDone: () => setSpeakingId(null), onStopped: () => setSpeakingId(null),
        onError: () => { setSpeakingId(null); setNotice('Дуут уншилт боломжгүй байна.'); } });
    } catch { setSpeakingId(null); setNotice('Дуут уншилт боломжгүй байна.'); }
  };

  useEffect(() => {
    if (!account || !knownAssistantIds.current) return;
    const newReplies = state.messages.filter((message) => message.role === 'assistant' &&
      message.status === 'sent' && !knownAssistantIds.current!.has(message.id));
    for (const reply of newReplies) knownAssistantIds.current.add(reply.id);
    const latest = newReplies.at(-1);
    if (latest && voiceEnabled && latest.clientConversationId === conversation && latest.content) {
      void toggleSpeech(latest.id, latest.content);
    }
  }, [state.messages, account, conversation, voiceEnabled]);

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
        knownAssistantIds.current = new Set(instance.view().messages.filter((message) => message.role === 'assistant').map((message) => message.id));
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
      knownAssistantIds.current = new Set(engine.current?.view().messages.filter((message) => message.role === 'assistant').map((message) => message.id));
    } catch (error) { setNotice(`Нэвтрэлт одоогоор боломжгүй байна. ${formatMobileAuthDiagnostic(error, 'chat_pull')}`); }
    finally { setWorking(false); }
  };
  const signOut = async () => {
    setWorking(true); setNotice('');
    try { await mobileSignOut(async () => {
      ExpoSpeechRecognitionModule.abort(); setListening(false);
      await Speech.stop(); setSpeakingId(null); knownAssistantIds.current = null;
      await engine.current?.switchAccount(null); setAccount(null); setConversation('');
    }); }
    catch { setNotice('Гарах үйлдэл амжилтгүй боллоо.'); }
    finally { setWorking(false); }
  };
  const send = async () => {
    const text = input.trim();
    if (!text || !account || working) return;
    setInput(''); setWorking(true); setNotice('');
    if (listening) { ExpoSpeechRecognitionModule.stop(); setListening(false); }
    await Speech.stop(); setSpeakingId(null);
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
    <AppHeader active={homeMode ? 'home' : 'chat'} />
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        {homeMode && visible.length === 0 ? <View style={styles.homeIdentity}>
          <Text style={styles.hello}>{greetingName ? `Сайн байна уу, ${greetingName}.` : 'Сайн байна уу, Nasa.'}</Text>
          <Text accessibilityRole="header" style={styles.homeTitle}>Энхтэй ярилцах</Text>
        </View> : <Text style={styles.title}>{t('chat.title')}</Text>}
        {account ? <View style={styles.headerControls}>
          <Pressable accessibilityRole="button" accessibilityLabel={voiceEnabled ? 'Автомат дууг унтраах' : 'Автомат дууг асаах'}
            onPress={() => { if (voiceEnabled) { void Speech.stop(); setSpeakingId(null); } setVoiceEnabled(!voiceEnabled); }} style={styles.control}>
            <Text>{voiceEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConversation(Crypto.randomUUID())} style={styles.control}><Text>{t('chat.new')}</Text></Pressable>
        </View> : null}
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
            {message.role === 'assistant' && message.content ? <Pressable accessibilityRole="button"
              accessibilityLabel={speakingId === message.id ? 'Уншилтыг зогсоох' : 'Хариултыг дуугаар унших'}
              onPress={() => void toggleSpeech(message.id, message.content)} style={styles.speakControl}>
              <Text style={styles.speakText}>{speakingId === message.id ? '■ Зогсоох' : '🔊 Сонсох'}</Text>
            </Pressable> : null}
            {message.status !== 'sent' ? <Text style={styles.pending}>{message.status === 'failed' ? 'Илгээгдээгүй' : 'Хүлээгдэж байна'}</Text> : null}
          </View>)}
          {working ? <ActivityIndicator /> : null}
        </ScrollView>
        {pending ? <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.control}>
          <Text>Хүлээгдэж буй {pending} · Дахин оролдох</Text></Pressable> : null}
        <View style={styles.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel={listening ? 'Яриаг зогсоож бичих' : 'Асуултаа дуугаар хэлэх'}
            disabled={working} onPress={() => void toggleDictation()} style={[styles.dictation, listening && styles.dictationActive]}>
            <Text style={styles.dictationText}>{listening ? '⌨' : '🎙'}</Text>
          </Pressable>
          <TextInput ref={inputRef} multiline value={input} onChangeText={setInput}
          accessibilityLabel={t('chat.placeholder')} placeholder={t('chat.placeholder')}
          style={styles.input} /><Pressable accessibilityRole="button" disabled={!input.trim() || working}
          onPress={() => void send()} style={styles.button}><Text style={styles.buttonText}>↑</Text></Pressable></View>
        {listening ? <Text accessibilityLiveRegion="polite" style={styles.help}>Сонсож байна… Яриагаа дуусгаад ↑ Илгээх дарна уу.</Text> : null}
        <Pressable accessibilityRole="button" disabled={working} onPress={() => void signOut()} style={styles.signOut}><Text>Гарах</Text></Pressable>
      </>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' }, layout: { flex: 1, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerControls: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#102A43' },
  homeIdentity: { flex: 1, paddingTop: 22, paddingBottom: 8 },
  hello: { color: '#7C90A8', fontSize: 14, lineHeight: 20 },
  homeTitle: { marginTop: 2, color: '#0B1F33', fontSize: 29, lineHeight: 36, fontWeight: '900' },
  control: { minHeight: 44, justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14 },
  tabs: { flexGrow: 0, maxHeight: 48 }, messages: { flex: 1, backgroundColor: '#EAF2FA', borderRadius: 20 },
  messageContent: { padding: 16, gap: 12 }, bubble: { maxWidth: '86%', padding: 14, borderRadius: 17 },
  user: { alignSelf: 'flex-end', backgroundColor: '#0B57D0' }, assistant: { alignSelf: 'flex-start', backgroundColor: '#FFF' },
  userText: { color: '#FFF', fontSize: 16, lineHeight: 24 }, assistantText: { color: '#243B53', fontSize: 16, lineHeight: 24 },
  pending: { color: '#D7E4F3', fontSize: 11, marginTop: 5 }, prompt: { gap: 14, marginTop: 20 },
  speakControl: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  speakText: { color: '#0B57D0', fontWeight: '700' },
  help: { color: '#627D98', fontSize: 14 }, button: { minHeight: 48, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 17, backgroundColor: '#0B57D0', borderRadius: 13 }, buttonText: { color: '#FFF', fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, backgroundColor: '#FFF', borderRadius: 18 },
  dictation: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#EAF2FF' },
  dictationActive: { backgroundColor: '#D8E9FF' }, dictationText: { fontSize: 20, color: '#0B57D0' },
  input: { flex: 1, minHeight: 46, maxHeight: 130, paddingHorizontal: 10, color: '#102A43' },
  signOut: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12 },
  notice: { color: '#744139', padding: 10, backgroundColor: '#FFF4F2', borderRadius: 10 },
});
