import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';
import { TranslationKey, useI18n } from '../i18n';

const primary = [
  { icon: '∑', title: 'tool.calculation', detail: 'Хувь, хэмжих нэгж', href: '/tools/calculation' },
  { icon: '◷', title: 'tool.reminder', detail: 'Цагтаа сануулах', href: '/action-reminder' },
  { icon: '▤', title: 'tool.document', detail: 'Ноорог ба DOCX', href: '/action-document' },
] as const;
const secondary = [
  { icon: 'T', title: 'tool.text', href: '/action-text' },
  { icon: '✉', title: 'tool.message', href: '/action-message' },
] as const;

export default function NativeActionsScreen() {
  const { t } = useI18n();
  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="tools" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>Actions</Text>
      <Text style={styles.subtitle}>Хийх ажлаа сонгоод шууд эхлээрэй.</Text>
      <View style={styles.cards}>{primary.map((item) => <Pressable key={item.title} accessibilityRole="link"
        accessibilityLabel={t(item.title as TranslationKey)} onPress={() => router.push(item.href)} style={styles.card}>
        <View style={styles.iconBox}><Text style={styles.icon}>{item.icon}</Text></View>
        <View style={styles.cardCopy}><Text style={styles.cardTitle}>{t(item.title as TranslationKey)}</Text>
          <Text style={styles.detail}>{item.detail}</Text></View><Text style={styles.arrow}>›</Text>
      </Pressable>)}</View>
      <Text accessibilityRole="header" style={styles.section}>Бусад хэрэгсэл</Text>
      <View style={styles.more}>{secondary.map((item) => <Pressable key={item.title} accessibilityRole="link"
        accessibilityLabel={t(item.title as TranslationKey)} onPress={() => router.push(item.href)} style={styles.moreCard}>
        <Text style={styles.moreIcon}>{item.icon}</Text><Text style={styles.moreText}>{t(item.title as TranslationKey)}</Text>
      </Pressable>)}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 32 },
  title: { color: '#102A43', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 5, color: '#627D98', fontSize: 14, lineHeight: 21 },
  cards: { marginTop: 22, gap: 10 },
  card: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 13,
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#DFEAF7' },
  iconBox: { width: 47, height: 47, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF' },
  icon: { color: '#0B57D0', fontSize: 22, fontWeight: '900' },
  cardCopy: { flex: 1 }, cardTitle: { color: '#102A43', fontSize: 16, fontWeight: '800' },
  detail: { marginTop: 4, color: '#7188A0', fontSize: 12 }, arrow: { color: '#0B57D0', fontSize: 27 },
  section: { marginTop: 27, marginBottom: 12, color: '#102A43', fontSize: 17, fontWeight: '900' },
  more: { flexDirection: 'row', gap: 10 },
  moreCard: { flex: 1, minHeight: 94, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14,
    borderWidth: 1, borderColor: '#DFEAF7' },
  moreIcon: { color: '#0B57D0', fontSize: 21, fontWeight: '900' },
  moreText: { marginTop: 9, color: '#102A43', fontSize: 13, fontWeight: '800' },
});
