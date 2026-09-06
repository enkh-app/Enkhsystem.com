import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';

type Mode = 'chat' | 'search';

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');

  const submit = () => {
    const value = input.trim();
    if (!value) return;

    router.push({
      pathname: mode === 'chat' ? '/chat' : '/knowledge-search',
      params: mode === 'chat' ? { prompt: value } : { q: value },
    });
  };

  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="home" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>ENKH ACTION PLATFORM</Text>
          <Text accessibilityRole="header" style={styles.title}>Асуух, хайх, тооцоолох — нэг дор.</Text>
          <Text style={styles.subtitle}>Монгол хэлээр асуултаа бич. ENKH тохирох үйлдлийг бодит production API-аар гүйцэтгэнэ.</Text>

          <View style={styles.composer}>
            <View style={styles.modes}>
              <ModeButton label="AI-аас асуух" selected={mode === 'chat'} onPress={() => setMode('chat')} />
              <ModeButton label="Вэбээс хайх" selected={mode === 'search'} onPress={() => setMode('search')} />
            </View>
            <TextInput
              accessibilityLabel="ENKH-д өгөх асуулт"
              multiline
              value={input}
              onChangeText={setInput}
              placeholder={mode === 'chat' ? 'Жишээ: ENKH систем гэж юу вэ?' : 'Жишээ: Өнөөдрийн технологийн мэдээ'}
              placeholderTextColor="#8A8A8A"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === 'chat' ? 'Асуулт илгээх' : 'Хайлт хийх'}
              disabled={!input.trim()}
              onPress={submit}
              style={({ pressed }) => [styles.submit, !input.trim() && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.submitText}>{mode === 'chat' ? 'Асуух →' : 'Хайх →'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.cards}>
          <Capability title="Chat" description="ENKH AI-аас Монгол хэлээр шууд хариулт авна." action="Ярилцах" onPress={() => router.push('/chat')} />
          <Capability title="Search" description="Вэб хайлт хийж, эх сурвалжтай хариулт авна." action="Хайх" onPress={() => router.push('/knowledge-search')} />
          <Capability title="Actions" description="Тооцоолол болон бэлэн үйлдлүүдийг ажиллуулна." action="Нээх" onPress={() => router.push('/actions')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.mode, selected && styles.modeSelected]}>
      <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function Capability({ title, description, action, onPress }: { title: string; description: string; action: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <Text style={styles.cardAction}>{action} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F5' },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 56 },
  hero: { width: '100%', maxWidth: 820, alignSelf: 'center', alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2.5, color: '#666' },
  title: { marginTop: 18, fontSize: 46, lineHeight: 54, fontWeight: '900', color: '#171717', textAlign: 'center' },
  subtitle: { marginTop: 16, maxWidth: 680, fontSize: 17, lineHeight: 26, color: '#666', textAlign: 'center' },
  composer: { width: '100%', marginTop: 34, padding: 10, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 4 },
  mode: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12 },
  modeSelected: { backgroundColor: '#EFEFEB' },
  modeText: { color: '#777', fontSize: 13, fontWeight: '700' },
  modeTextSelected: { color: '#171717' },
  input: { minHeight: 100, maxHeight: 220, paddingHorizontal: 14, paddingVertical: 14, fontSize: 17, lineHeight: 25, color: '#171717', textAlignVertical: 'top' },
  submit: { minHeight: 48, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 15, backgroundColor: '#171717' },
  submitText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.7 },
  cards: { marginTop: 54, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { flexGrow: 1, flexBasis: 260, minHeight: 180, padding: 24, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E4E4E1' },
  cardTitle: { fontSize: 21, fontWeight: '800', color: '#171717' },
  cardDescription: { flex: 1, marginTop: 12, fontSize: 15, lineHeight: 23, color: '#686868' },
  cardAction: { marginTop: 24, fontSize: 14, fontWeight: '800', color: '#171717' },
});
