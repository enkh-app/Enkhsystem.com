import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WorkspaceSyncStatus } from './workspace-sync-status';
import { EnkhColors } from '../constants/design';

type ActiveRoute = 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status';
type AppHeaderProps = { active?: ActiveRoute };

const primary = [
  { id: 'home', label: 'Нүүр', icon: '⌂', href: '/' },
  { id: 'chat', label: 'Chat', icon: '✦', href: '/chat' },
  { id: 'search', label: 'Хайлт', icon: '⌕', href: '/search' },
  { id: 'workspace', label: 'Workspace', icon: '▣', href: '/workspace' },
  { id: 'tools', label: 'Tools', icon: '◇', href: '/tools' },
] as const;

const utility = [
  { id: 'status', label: 'Status', icon: '●', href: '/status' },
  { id: 'account', label: 'Account', icon: '○', href: '/account' },
] as const;

export function AppHeader({ active }: AppHeaderProps) {
  const link = (item: (typeof primary)[number] | (typeof utility)[number]) => {
    const selected = active === item.id;
    return (
      <Pressable
        key={item.id}
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected }}
        onPress={() => router.push(item.href)}
        style={({ pressed }) => [styles.navItem, selected && styles.navItemActive, pressed && styles.pressed]}>
        <Text aria-hidden style={[styles.navIcon, selected && styles.navTextActive]}>{item.icon}</Text>
        <Text style={[styles.navText, selected && styles.navTextActive]}>{item.label}</Text>
      </Pressable>
    );
  };

  return (
    <View nativeID="enkh-header" style={styles.header}>
      <View nativeID="enkh-brand-row" style={styles.brandRow}>
        <Pressable accessibilityRole="link" accessibilityLabel="ENKH нүүр хуудас" onPress={() => router.push('/')} style={styles.brand}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>E</Text></View>
          <View><Text style={styles.logo}>ENKH</Text><Text style={styles.tagline}>AI ASSISTANT</Text></View>
        </Pressable>
        <View nativeID="enkh-mobile-controls" style={styles.mobileControls}><Text style={styles.language}>MN</Text><Pressable accessibilityRole="link" accessibilityLabel="Account" onPress={() => router.push('/account')} style={styles.avatar}><Text style={styles.avatarText}>Н</Text></Pressable></View>
      </View>

      <View nativeID="enkh-primary-nav" accessibilityLabel="Үндсэн цэс" style={styles.primary}>{primary.map(link)}</View>

      <View nativeID="enkh-desktop-footer" style={styles.footer}>
        <WorkspaceSyncStatus />
        <View style={styles.divider} />
        <Text accessibilityLabel="Хэл: Монгол" style={styles.language}>MN · Монгол</Text>
        <View accessibilityLabel="Account болон system цэс" style={styles.utility}>{utility.map(link)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: '#FFFFFF', borderColor: '#DDE8F8', borderBottomWidth: 1, zIndex: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: EnkhColors.primary },
  brandMarkText: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  logo: { fontSize: 19, fontWeight: '900', letterSpacing: 3.2, color: '#102A43' },
  tagline: { marginTop: 2, fontSize: 8, letterSpacing: 1.8, fontWeight: '800', color: '#7290B2' },
  primary: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  navItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, borderRadius: 13 },
  navItemActive: { backgroundColor: EnkhColors.primarySoft },
  navIcon: { width: 20, textAlign: 'center', color: '#6783A3', fontSize: 18, fontWeight: '800' },
  navText: { color: '#486581', fontSize: 15, fontWeight: '700' },
  navTextActive: { color: EnkhColors.primary },
  footer: { display: 'none', marginTop: 'auto', gap: 9 },
  divider: { height: 1, marginVertical: 5, backgroundColor: '#E6EEF8' },
  utility: { gap: 4 },
  language: { minHeight: 38, textAlignVertical: 'center', paddingHorizontal: 12, color: '#627D98', fontSize: 13, fontWeight: '800' },
  mobileControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: EnkhColors.primary },
  avatarText: { color: '#FFFFFF', fontWeight: '900' },
  pressed: { opacity: 0.68 },
});
