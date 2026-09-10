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
          <View nativeID="enkh-folded-mark" accessibilityElementsHidden style={styles.brandMark}>
            <View nativeID="enkh-fold-top" style={[styles.fold, styles.foldTop]} />
            <View nativeID="enkh-fold-middle" style={[styles.fold, styles.foldMiddle]} />
            <View nativeID="enkh-fold-bottom" style={[styles.fold, styles.foldBottom]} />
            <View nativeID="enkh-fold-spine" style={styles.foldSpine} />
          </View>
          <View nativeID="enkh-brand-copy" style={styles.brandCopy}><Text style={styles.logo}>ENKH AI</Text><Text style={styles.tagline}>YOUR WORK PARTNER</Text></View>
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
  brand: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 42, height: 42, position: 'relative' },
  fold: { position: 'absolute', left: 10, width: 28, height: 9, borderRadius: 3, transform: [{ skewX: '-23deg' }] },
  foldTop: { top: 3, backgroundColor: '#17C9ED' },
  foldMiddle: { top: 16, width: 23, backgroundColor: '#168DE8' },
  foldBottom: { top: 29, backgroundColor: '#1554D1' },
  foldSpine: { position: 'absolute', left: 4, top: 5, width: 10, height: 33, borderRadius: 3, backgroundColor: '#0C66DC', transform: [{ skewY: '-18deg' }] },
  brandCopy: { justifyContent: 'center' },
  logo: { fontSize: 18, fontWeight: '900', letterSpacing: 2.3, color: '#102A43' },
  tagline: { marginTop: 3, fontSize: 7, letterSpacing: 1.45, fontWeight: '800', color: '#7290B2' },
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
