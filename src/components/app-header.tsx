import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AppHeaderProps = { active?: 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status' };

const primary = [
  { id: 'home', label: 'Нүүр', href: '/' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'search', label: 'Search', href: '/search' },
  { id: 'workspace', label: 'Workspace', href: '/workspace' },
] as const;

const secondary = [
  { id: 'tools', label: 'Tools', href: '/tools' },
  { id: 'account', label: 'Account', href: '/account' },
  { id: 'status', label: 'Status', href: '/status' },
] as const;

export function AppHeader({ active }: AppHeaderProps) {
  const link = (item: (typeof primary)[number] | (typeof secondary)[number]) => {
    const selected = active === item.id;
    return (
      <Pressable key={item.id} accessibilityRole="link" accessibilityLabel={item.label} accessibilityState={{ selected }} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.navItem, selected && styles.navItemActive, pressed && styles.pressed]}>
        <Text style={[styles.navText, selected && styles.navTextActive]}>{item.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="link" accessibilityLabel="ENKH нүүр хуудас" onPress={() => router.push('/')} style={styles.brand}>
          <Text style={styles.logo}>ENKH</Text><Text style={styles.tagline}>AI ASSISTANT</Text>
        </Pressable>
        <View accessibilityLabel="Үндсэн цэс" style={styles.primary}>{primary.map(link)}</View>
      </View>
      <View style={styles.utilityRow}>
        <Text style={styles.localState}>LOCAL WORKSPACE</Text>
        <View accessibilityLabel="Tools болон system цэс" style={styles.secondary}>{secondary.map(link)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 8 },
  topRow: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { minWidth: 104, minHeight: 44, justifyContent: 'center' }, logo: { fontSize: 22, fontWeight: '900', letterSpacing: 4, color: '#171717' }, tagline: { marginTop: 2, fontSize: 8, letterSpacing: 2, color: '#737373' },
  primary: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, utilityRow: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#E5E5E1' }, secondary: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  localState: { minHeight: 44, textAlignVertical: 'center', fontSize: 9, letterSpacing: 1.4, fontWeight: '900', color: '#888' },
  navItem: { minHeight: 44, minWidth: 52, paddingHorizontal: 13, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, navItemActive: { backgroundColor: '#171717' }, navText: { fontSize: 13, fontWeight: '700', color: '#525252' }, navTextActive: { color: '#FFF' }, pressed: { opacity: 0.7 },
});
