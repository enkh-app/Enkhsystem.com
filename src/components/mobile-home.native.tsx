import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from './app-header';
import { useI18n } from '../i18n';

const shortcuts = [
  { icon: '✦', title: 'Chat', caption: 'Энхээс асуух', href: '/chat' },
  { icon: '◇', title: 'Actions', caption: 'Ажлаа амжуулах', href: '/actions' },
  { icon: '⌕', title: 'Knowledge', caption: 'Хайж мэдэх', href: '/knowledge' },
] as const;

export default function MobileHome() {
  const { t } = useI18n();
  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="home" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>ENKH · ТАНЫ ХАЛААСНЫ ТУСЛАХ</Text>
      <Text accessibilityRole="header" style={styles.greeting}>Сайн байна уу, Nasa.</Text>
      <Text style={styles.intro}>Юу асуух эсвэл амжуулахыг хүсэж байна?</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Chat эхлүүлэх"
        onPress={() => router.navigate('/chat')} style={styles.chatCard}>
        <Text style={styles.chatIcon}>✦</Text>
        <Text style={styles.chatTitle}>Энхтэй ярилцах</Text>
        <Text style={styles.chatDescription}>Асуултаа бичээд бодит хариу аваарай.</Text>
        <View style={styles.chatAction}><Text style={styles.chatActionText}>Chat нээх  →</Text></View>
      </Pressable>
      <Text accessibilityRole="header" style={styles.section}>Хурдан эхлэх</Text>
      <View style={styles.shortcuts}>{shortcuts.map((item) => <Pressable key={item.href}
        accessibilityRole="link" accessibilityLabel={item.title} onPress={() => router.navigate(item.href)}
        style={styles.shortcut}>
        <Text style={styles.shortcutIcon}>{item.icon}</Text>
        <Text style={styles.shortcutTitle}>{item.title}</Text>
        <Text style={styles.shortcutCaption}>{item.caption}</Text>
      </Pressable>)}</View>
      <Pressable accessibilityRole="link" onPress={() => router.navigate('/account')} style={styles.accountLink}>
        <Text style={styles.accountText}>{t('nav.account')}  →</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  content: { paddingHorizontal: 18, paddingTop: 25, paddingBottom: 28 },
  eyebrow: { color: '#0B57D0', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  greeting: { marginTop: 8, color: '#102A43', fontSize: 28, lineHeight: 36, fontWeight: '900' },
  intro: { marginTop: 7, color: '#627D98', fontSize: 15, lineHeight: 22 },
  chatCard: { marginTop: 24, minHeight: 205, borderRadius: 24, padding: 22, backgroundColor: '#0B57D0' },
  chatIcon: { color: '#8FE8FA', fontSize: 27, fontWeight: '900' },
  chatTitle: { marginTop: 8, color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  chatDescription: { marginTop: 6, color: '#DFEAFF', fontSize: 14, lineHeight: 21 },
  chatAction: { alignSelf: 'flex-start', marginTop: 19, minHeight: 44, justifyContent: 'center',
    paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 13 },
  chatActionText: { color: '#0B57D0', fontWeight: '900' },
  section: { marginTop: 27, marginBottom: 12, color: '#102A43', fontSize: 18, fontWeight: '900' },
  shortcuts: { flexDirection: 'row', gap: 9 },
  shortcut: { flex: 1, minHeight: 112, padding: 12, borderRadius: 17, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#DFEAF7' },
  shortcutIcon: { color: '#0B57D0', fontSize: 23, fontWeight: '800' },
  shortcutTitle: { marginTop: 6, color: '#102A43', fontSize: 13, fontWeight: '900' },
  shortcutCaption: { marginTop: 3, color: '#7188A0', fontSize: 10, lineHeight: 14 },
  accountLink: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 20 },
  accountText: { color: '#0B57D0', fontWeight: '800' },
});
