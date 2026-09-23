import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from './app-header';
import { mobileProfile } from '../mobile/auth.native';

export const mobileHomePrimaryDestinations = [
  { href: '/chat' },
  { href: '/actions' },
  { href: '/knowledge' },
] as const;

const DEFAULT_GREETING = 'Сайн байна уу, Nasa.';

export default function MobileHome() {
  const [input, setInput] = useState('');
  const [greetingName, setGreetingName] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void mobileProfile().then((profile) => { if (active) setGreetingName(profile.greetingName); });
    return () => { active = false; };
  }, []));

  const submit = () => {
    const prompt = input.trim();
    if (!prompt) return;
    setInput('');
    router.navigate({ pathname: '/chat', params: { prompt } });
  };

  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="home" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.identity}>
          
          <View style={styles.identityText}>
            <Text style={styles.hello}>{greetingName ? `Сайн байна уу, ${greetingName}.` : 'Сайн байна уу, Nasa.'}</Text>
            <Text accessibilityRole="header" style={styles.title}>Энхтэй ярилцах</Text>
          </View>
        </View>

        <View style={styles.composer}>
          <TextInput accessibilityLabel="Энхэд бичих зурвас" multiline value={input} onChangeText={setInput}
            placeholder="Энхээс юм асуух..." placeholderTextColor="#829AB1" style={styles.input}
            returnKeyType="send" blurOnSubmit={false} onSubmitEditing={submit} />
          <View style={styles.composerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Дуугаар ярих" onPress={() => router.navigate('/chat')}
              style={({ pressed }) => [styles.voice, pressed && styles.pressed]}>
              <Text style={styles.voiceIcon}>🎙</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Илгээх" disabled={!input.trim()} onPress={submit}
              style={({ pressed }) => [styles.send, !input.trim() && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.sendText}>Илгээх  ↑</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.hint}>Асуулт, тооцоо, баримт бичиг, ажлын төлөвлөгөөг эндээс эхлүүлнэ.</Text>
      </ScrollView>
    </KeyboardAvoidingView>

  </SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 18, paddingTop: 48, paddingBottom: 42 },
  identity: { marginBottom: 25 },
  avatar: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F6FE4' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  identityText: { flex: 1 },
  hello: { color: '#7C90A8', fontSize: 14, lineHeight: 20 },
  title: { marginTop: 2, color: '#0B1F33', fontSize: 29, lineHeight: 36, fontWeight: '900' },
  composer: { padding: 14, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE3EB',
    shadowColor: '#0B1F33', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  input: { minHeight: 92, maxHeight: 190, paddingHorizontal: 3, paddingTop: 2, paddingBottom: 12,
    color: '#0B1F33', fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  voice: { minHeight: 46, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F6F9', borderWidth: 1, borderColor: '#DFE6ED' },
  voiceIcon: { color: '#2F6FE4', fontSize: 20 },
  voiceText: { color: '#526D82', fontSize: 13, fontWeight: '800' },
  send: { minHeight: 46, paddingHorizontal: 18, borderRadius: 14, justifyContent: 'center', backgroundColor: '#2F6FE4' },
  sendText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  hint: { marginTop: 14, paddingHorizontal: 5, color: '#7188A0', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});