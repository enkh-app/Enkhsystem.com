import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';

export default function KnowledgeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ENKH KNOWLEDGE</Text>
        <Text accessibilityRole="header" style={styles.title}>Мэдлэг авах хоёр арга</Text>
        <Text style={styles.subtitle}>AI-аас шууд асуух эсвэл бодит вэбээс эх сурвалжтай хайлт хийх.</Text>
        <View style={styles.cards}>
          <KnowledgeCard title="AI-аас асуух" description="Ерөнхий мэдлэг, тайлбар, санаа боловсруулахад тохиромжтой." action="Chat нээх" onPress={() => router.push('/chat')} />
          <KnowledgeCard title="Вэбээс хайх" description="Сүүлийн үеийн мэдээлэл, холбоос, эх сурвалж шаардлагатай үед ашиглана." action="Search нээх" onPress={() => router.push('/knowledge-search')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function KnowledgeCard({ title, description, action, onPress }: { title: string; description: string; action: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <Text style={styles.action}>{action} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F5' },
  content: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 48 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: '900', color: '#777', textAlign: 'center' },
  title: { marginTop: 16, fontSize: 40, lineHeight: 48, fontWeight: '900', color: '#171717', textAlign: 'center' },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 24, color: '#686868', textAlign: 'center' },
  cards: { marginTop: 34, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { flexGrow: 1, flexBasis: 300, minHeight: 210, padding: 24, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1DD' },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#171717' },
  cardDescription: { flex: 1, marginTop: 12, fontSize: 15, lineHeight: 23, color: '#686868' },
  action: { marginTop: 24, fontSize: 14, fontWeight: '900', color: '#171717' },
  pressed: { opacity: 0.7 },
});
