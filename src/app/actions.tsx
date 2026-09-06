import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';

const available = [
  { title: 'Тооцоолол', description: 'Тоон илэрхийлэл, хувь болон хэмжих нэгжтэй тооцоо.', route: '/tools/calculation', label: 'Ажиллуулах' },
  { title: 'AI мэдлэг', description: 'Монгол асуултад ENKH AI-аас шууд хариулт авах.', route: '/chat', label: 'Асуух' },
  { title: 'Вэб хайлт', description: 'Бодит вэб хайлт, нэгтгэсэн хариу, эх сурвалж.', route: '/search', label: 'Хайх' },
] as const;

const upcoming = ['Мессеж бэлтгэх', 'Сануулагч', 'Баримт бичиг', 'Текст боловсруулах'];

export default function ActionsScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="tools" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>ENKH Tools</Text>
        <Text style={styles.subtitle}>Бодитоор ажиллаж байгаа хэрэгслүүд ба compatibility action-ууд.</Text>

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

        <Text accessibilityRole="header" style={styles.upcomingTitle}>Дараагийн боломжууд</Text>
        <View style={styles.upcomingList}>
          {upcoming.map((item) => <View key={item} style={styles.upcomingCard}><Text style={styles.upcomingName}>{item}</Text><Text style={styles.upcomingBadge}>Тун удахгүй</Text></View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F5' },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 42, paddingBottom: 56 },
  title: { fontSize: 40, lineHeight: 48, fontWeight: '900', color: '#171717' },
  subtitle: { marginTop: 10, fontSize: 16, color: '#6B6B6B' },
  list: { marginTop: 30, gap: 12 },
  card: { minHeight: 150, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20, padding: 22, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1DD' },
  info: { flex: 1, minWidth: 220 },
  liveBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: '#E7F6EB' },
  liveText: { fontSize: 10, letterSpacing: 1, fontWeight: '900', color: '#26713A' },
  cardTitle: { marginTop: 13, fontSize: 21, fontWeight: '900', color: '#171717' },
  description: { marginTop: 7, fontSize: 14, lineHeight: 21, color: '#707070' },
  action: { fontSize: 14, fontWeight: '900', color: '#171717' },
  upcomingTitle: { marginTop: 44, fontSize: 22, fontWeight: '900', color: '#171717' },
  upcomingList: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  upcomingCard: { flexGrow: 1, flexBasis: 200, minHeight: 76, justifyContent: 'center', padding: 16, borderRadius: 16, backgroundColor: '#EEEDEA' },
  upcomingName: { fontSize: 15, fontWeight: '700', color: '#555' },
  upcomingBadge: { marginTop: 5, fontSize: 12, color: '#888' },
  pressed: { opacity: 0.7 },
});
