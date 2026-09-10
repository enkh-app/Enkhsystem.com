import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';
import { enkhStructuredData, SeoHead } from '../components/seo-head';
import { EnkhColors, EnkhLayout } from '../constants/design';
import { backgroundWorkspaceSync, workspaceSyncLabel, WorkspaceSyncSnapshot } from '../workspace-sync';
import { loadWorkspace, workspaceSessionLabel, WorkspaceSession, WorkspaceState } from '../workspace-store';

type Mode = 'chat' | 'search';
const hero = require('../../assets/images/enkh-mountain-hero.png');
const examples = ['Өнөөдрийн ажлаа төлөвлөе', 'Монголын тухай мэдээлэл хайх', '520 м² дээр 8% нэмэх'];

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [recent, setRecent] = useState<WorkspaceSession[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ version: 1, sessions: [], entries: [] });
  const [sync, setSync] = useState<WorkspaceSyncSnapshot>(backgroundWorkspaceSync.getSnapshot());

  useEffect(() => {
    const loaded = loadWorkspace().state;
    setWorkspace(loaded);
    setRecent(loaded.sessions.slice(0, 4));
    const unsubscribe = backgroundWorkspaceSync.subscribe(() => setSync(backgroundWorkspaceSync.getSnapshot()));
    return () => { unsubscribe(); };
  }, []);

  const submit = (value = input) => {
    const prompt = value.trim();
    if (!prompt) return;
    router.push({ pathname: mode === 'chat' ? '/chat' : '/search', params: mode === 'chat' ? { prompt } : { q: prompt } });
  };

  return (
    <SafeAreaView style={styles.page}>
      <SeoHead
        title="ENKH — Монгол хэл дээрх AI туслах"
        description="ENKH нь Монгол хэлээр асуух, эх сурвалжтай хайх, тооцоолох, текст, мессеж болон баримт бичиг бэлтгэх AI туслах юм."
        path="/"
        structuredData={enkhStructuredData}
      />
      <AppHeader active="home" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ImageBackground source={hero} imageStyle={styles.heroImage} style={styles.hero}>
          <View style={styles.heroShade}>
            <Text style={styles.eyebrow}>ENKH · ТАНЫ ӨДӨР ТУТМЫН AI</Text>
            <Text accessibilityRole="header" style={styles.title}>Сайн байна уу!</Text>
            <Text style={styles.subtitle}>Асуух, хайх, тооцоолох ажлаа нэг тайван орчноос эхлүүлээрэй.</Text>
            <View style={styles.composer}>
              <View style={styles.modes}>
                <ModeButton label="ENKH-ээс асуух" selected={mode === 'chat'} onPress={() => setMode('chat')} />
                <ModeButton label="Вэбээс хайх" selected={mode === 'search'} onPress={() => setMode('search')} />
              </View>
              <TextInput accessibilityLabel="ENKH-д өгөх асуулт" multiline value={input} onChangeText={setInput} placeholder={mode === 'chat' ? 'Юу мэдэхийг хүсэж байна вэ?' : 'Юу хайх вэ?'} placeholderTextColor="#71839A" style={styles.input} />
              <Pressable accessibilityRole="button" accessibilityLabel={mode === 'chat' ? 'Асуулт илгээх' : 'Хайлт хийх'} disabled={!input.trim()} onPress={() => submit()} style={({ pressed }) => [styles.submit, !input.trim() && styles.disabled, pressed && styles.pressed]}><Text style={styles.submitText}>{mode === 'chat' ? 'Асуух' : 'Хайх'} →</Text></Pressable>
            </View>
            <View style={styles.chips}>{examples.map((example) => <Pressable key={example} accessibilityRole="button" onPress={() => { setMode(example.includes('хайх') ? 'search' : 'chat'); setInput(example); }} style={styles.chip}><Text style={styles.chipText}>{example}</Text></Pressable>)}</View>
          </View>
        </ImageBackground>

        <View style={styles.aboutCard}>
          <Text accessibilityRole="header" style={styles.aboutTitle}>ENKH гэж юу вэ?</Text>
          <Text style={styles.aboutText}>ENKH буюу Enkh AI нь өдөр тутмын асуулт, эх сурвалжтай вэб хайлт, хувь ба хэмжих нэгжийн тооцоо, текст боловсруулах, мессеж болон бүтэцтэй баримт бичиг бэлтгэхэд тусалдаг Монгол хэл дээрх AI бүтээгдэхүүн юм.</Text>
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Юу хийх вэ?</Text><Text style={styles.sectionCaption}>Таны ENKH workspace</Text></View>
        <View style={styles.cards}>
          <Feature icon="✦" title="Chat" description="Ойлгомжтой, үргэлжилсэн яриа" onPress={() => router.push('/chat')} />
          <Feature icon="⌕" title="Хайлт" description="Эх сурвалжтай бодит хайлт" onPress={() => router.push('/search')} />
          <Feature icon="▣" title="Workspace" description="Таны хадгалсан ажлууд" onPress={() => router.push('/workspace')} />
          <Feature icon="◇" title="Tools" description="Бодитоор ажиллах хэрэгслүүд" onPress={() => router.push('/tools')} />
        </View>

        <View style={styles.dashboardRow}>
          <View style={styles.recentPanel}>
            <View style={styles.panelHeading}><View><Text style={styles.panelEyebrow}>RECENT WORK</Text><Text style={styles.panelTitle}>Сүүлийн ажлууд</Text></View><Pressable accessibilityRole="link" onPress={() => router.push('/workspace')}><Text style={styles.link}>Бүгдийг харах →</Text></Pressable></View>
            {recent.length ? recent.map((session) => <Pressable key={session.id} accessibilityRole="link" onPress={() => router.push('/workspace')} style={styles.recentItem}><View style={styles.recentIcon}><Text style={styles.recentIconText}>{session.type === 'chat' ? '✦' : session.type === 'search' ? '⌕' : '◇'}</Text></View><View style={styles.recentText}><Text numberOfLines={1} style={styles.recentTitle}>{session.title}</Text><Text style={styles.recentMeta}>{workspaceSessionLabel(workspace, session)} · {new Date(session.updatedAt).toLocaleDateString()}</Text></View></Pressable>) : <View style={styles.empty}><Text style={styles.emptyTitle}>Workspace хоосон байна</Text><Text style={styles.emptyText}>ENKH ашиглахад таны бодит ажлууд энд харагдана.</Text></View>}
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.summaryCard}><Text style={styles.panelEyebrow}>WORKSPACE</Text><Text style={styles.summaryTitle}>{workspaceSyncLabel(sync.phase)}</Text><Text style={styles.summaryText}>{sync.revision > 0 ? 'Cloud workspace-тэй холбогдсон.' : 'Local workspace бэлэн.'}</Text><Pressable accessibilityRole="link" onPress={() => router.push('/workspace')}><Text style={styles.link}>Workspace нээх →</Text></Pressable></View>
            <View style={styles.quickCard}><Text style={styles.panelEyebrow}>QUICK TOOLS</Text><QuickTool icon="T" label="Текст боловсруулах" onPress={() => router.push({ pathname: '/action/[id]', params: { id: 'text' } })}/><QuickTool icon="✉" label="Мессеж бэлтгэх" onPress={() => router.push('/action-message')}/><QuickTool icon="▤" label="Баримт бичиг" onPress={() => router.push('/action-document')}/><QuickTool icon="∑" label="Тооцоолол" onPress={() => router.push('/tools/calculation')}/></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.mode, selected && styles.modeSelected]}><Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text></Pressable>;
}

function Feature({ icon, title, description, onPress }: { icon: string; title: string; description: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.cardIcon}><Text style={styles.cardIconText}>{icon}</Text></View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardDescription}>{description}</Text><Text style={styles.cardAction}>Нээх →</Text></Pressable>;
}

function QuickTool({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="link" onPress={onPress} style={styles.quickLink}><Text style={styles.quickIcon}>{icon}</Text><Text style={styles.quickText}>{label}</Text><Text style={styles.quickArrow}>→</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: EnkhColors.canvas },
  content: { width: '100%', maxWidth: EnkhLayout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 60 },
  hero: { width: '100%', minHeight: 470, overflow: 'hidden', borderRadius: 28, justifyContent: 'center', backgroundColor: '#0A3A72' },
  heroImage: { borderRadius: 28 },
  heroShade: { flex: 1, minHeight: 470, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40, backgroundColor: 'rgba(5,35,76,0.34)' },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 2.2, color: '#DCEAFF' },
  title: { marginTop: 13, fontSize: 46, lineHeight: 55, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { marginTop: 10, maxWidth: 650, fontSize: 17, lineHeight: 25, color: '#EFF6FF', textAlign: 'center' },
  composer: { width: '100%', maxWidth: 720, marginTop: 26, padding: 8, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.97)', shadowColor: '#082446', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 3 },
  mode: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 11 },
  modeSelected: { backgroundColor: '#E8F1FF' }, modeText: { color: '#6B7F95', fontSize: 13, fontWeight: '800' }, modeTextSelected: { color: '#0B57D0' },
  input: { minHeight: 80, maxHeight: 180, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17, lineHeight: 25, color: '#102A43', textAlignVertical: 'top' },
  submit: { minHeight: 48, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 14, backgroundColor: EnkhColors.primary }, submitText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  chips: { maxWidth: 780, marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.88)' }, chipText: { color: '#1D4E89', fontSize: 13, fontWeight: '700' },
  sectionHeading: { marginTop: 38, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }, sectionTitle: { fontSize: 25, fontWeight: '900', color: '#102A43' }, sectionCaption: { fontSize: 13, fontWeight: '700', color: '#829AB1' },
  aboutCard: { marginTop: 20, padding: 22, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFEAF7' },
  aboutTitle: { fontSize: 20, fontWeight: '900', color: '#102A43' },
  aboutText: { marginTop: 8, maxWidth: 860, fontSize: 15, lineHeight: 24, color: '#526D82' },
  cards: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexGrow: 1, flexBasis: 180, minHeight: 180, padding: 19, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFEAF7', shadowColor: '#24527A', shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  cardIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF' }, cardIconText: { color: '#0B57D0', fontSize: 19, fontWeight: '900' }, cardTitle: { marginTop: 15, fontSize: 18, fontWeight: '900', color: '#102A43' }, cardDescription: { flex: 1, marginTop: 7, fontSize: 14, lineHeight: 21, color: '#627D98' }, cardAction: { marginTop: 14, color: '#0B57D0', fontSize: 13, fontWeight: '900' },
  dashboardRow: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, recentPanel: { flexGrow: 2, flexBasis: 520, padding: 22, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFEAF7' }, sideColumn: { flexGrow: 1, flexBasis: 280, gap: 14 }, summaryCard: { padding: 22, borderRadius: 22, backgroundColor: '#0B57D0' }, quickCard: { padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DFEAF7' },
  panelHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, panelEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.6, color: '#7B96B3' }, panelTitle: { marginTop: 5, fontSize: 20, fontWeight: '900', color: '#102A43' }, link: { minHeight: 44, textAlignVertical: 'center', color: '#0B57D0', fontSize: 13, fontWeight: '900' },
  recentItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#EDF3F9' }, recentIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF5FD' }, recentIconText: { color: '#0B57D0', fontWeight: '900' }, recentText: { flex: 1 }, recentTitle: { fontSize: 15, fontWeight: '800', color: '#243B53' }, recentMeta: { marginTop: 4, fontSize: 10, letterSpacing: 0.7, fontWeight: '800', color: '#829AB1' },
  empty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 18 }, emptyTitle: { color: '#243B53', fontSize: 17, fontWeight: '900' }, emptyText: { marginTop: 7, maxWidth: 420, textAlign: 'center', color: '#829AB1', fontSize: 14, lineHeight: 21 },
  summaryTitle: { marginTop: 12, color: '#FFFFFF', fontSize: 21, fontWeight: '900' }, summaryText: { marginTop: 7, color: '#D9E9FF', fontSize: 14, lineHeight: 21 },
  quickLink: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EDF3F9' }, quickIcon: { width: 24, color: '#0B57D0', fontSize: 17, fontWeight: '900' }, quickText: { flex: 1, color: '#243B53', fontSize: 14, fontWeight: '800' }, quickArrow: { color: '#829AB1' },
  disabled: { opacity: 0.45 }, pressed: { opacity: 0.72 },
});
