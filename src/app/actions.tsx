import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';
import { SeoHead } from '../components/seo-head';

const available = [
  { title: 'Тооцоолол', description: 'Тоон илэрхийлэл, хувь болон хэмжих нэгжтэй тооцоо.', route: '/tools/calculation', label: 'Ажиллуулах' },
  { title: 'Текст боловсруулах', description: 'Засах, богиносгох, дэлгэрүүлэх, хураангуйлах, орчуулах.', route: '/action/text', label: 'Боловсруулах' },
  { title: 'Мессеж бэлтгэх', description: 'Өнгө аястай editable draft бэлтгэнэ; автоматаар илгээхгүй.', route: '/action-message', label: 'Ноорог бэлтгэх' },
  { title: 'Баримт бичиг', description: 'Бүтэцтэй editable баримтын draft бэлтгэнэ.', route: '/action-document', label: 'Ноорог бэлтгэх' },
  { title: 'Сануулга', description: 'Browser хаалттай байсан ч хадгалагдах, UTC-д суурилсан ENKH сануулагч.', route: '/action-reminder', label: 'Товлох' },
] as const;

export default function ActionsScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <SeoHead title="ENKH Tools — AI ажлын хэрэгслүүд" description="Тооцоолол, текст боловсруулах, мессеж болон бүтэцтэй баримт бичиг бэлтгэх ENKH хэрэгслүүд." path="/tools" />
      <AppHeader active="tools" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>ENKH Tools</Text>
        <Text style={styles.subtitle}>Таны ажлыг хурдан бэлтгэх бодитоор ажилладаг хэрэгслүүд.</Text>

        <Text accessibilityRole="header" style={styles.groupTitle}>Ажиллаж байгаа</Text>

        <View style={styles.list}>
          {available.map((action) => (
            <Pressable key={action.title} accessibilityRole="link" accessibilityLabel={`${action.title} ${action.label}`} onPress={() => router.push(action.route)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.info}>
                <View style={styles.liveBadge}><Text style={styles.liveText}>АЖИЛЛАЖ БАЙНА</Text></View>
                <Text style={styles.cardTitle}>{action.title}</Text>
                <Text style={styles.description}>{action.description}</Text>
              </View>
              <Text style={styles.action}>{action.label} →</Text>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 42, paddingBottom: 56 },
  title: { fontSize: 40, lineHeight: 48, fontWeight: '900', color: '#102A43' },
  subtitle: { marginTop: 10, fontSize: 16, color: '#627D98' },
  groupTitle: { marginTop: 30, fontSize: 22, fontWeight: '900', color: '#102A43' },
  list: { marginTop: 14, gap: 12 },
  card: { minHeight: 150, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20, padding: 22, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFEAF7' },
  info: { flex: 1, minWidth: 220 },
  liveBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: '#E7F6EB' },
  liveText: { fontSize: 10, letterSpacing: 1, fontWeight: '900', color: '#26713A' },
  cardTitle: { marginTop: 13, fontSize: 21, fontWeight: '900', color: '#102A43' },
  description: { marginTop: 7, fontSize: 14, lineHeight: 21, color: '#627D98' },
  action: { fontSize: 14, fontWeight: '900', color: '#0B57D0' },
  upcomingTitle: { marginTop: 44, fontSize: 22, fontWeight: '900', color: '#102A43' },
  upcomingList: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  upcomingCard: { flexGrow: 1, flexBasis: 200, minHeight: 76, justifyContent: 'center', padding: 16, borderRadius: 16, backgroundColor: '#EAF2FF' },
  upcomingName: { fontSize: 15, fontWeight: '700', color: '#555' },
  upcomingBadge: { marginTop: 5, fontSize: 12, color: '#888' },
  pressed: { opacity: 0.7 },
});
