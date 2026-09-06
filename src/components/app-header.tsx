import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AppHeaderProps = {
  active?: 'home' | 'chat' | 'search' | 'actions';
};

const items = [
  { id: 'home', label: 'Нүүр', href: '/' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'search', label: 'Хайлт', href: '/knowledge-search' },
  { id: 'actions', label: 'Actions', href: '/actions' },
] as const;

export function AppHeader({ active }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="ENKH нүүр хуудас"
        onPress={() => router.push('/')}
        style={styles.brand}
      >
        <Text style={styles.logo}>ENKH</Text>
        <Text style={styles.tagline}>AI ASSISTANT</Text>
      </Pressable>

      <View accessibilityLabel="Үндсэн цэс" style={styles.navigation}>
        {items.map((item) => {
          const selected = active === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.navItem,
                selected && styles.navItemActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.navText, selected && styles.navTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: { minWidth: 96 },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 4, color: '#171717' },
  tagline: { marginTop: 2, fontSize: 8, letterSpacing: 2, color: '#737373' },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  navItem: { minHeight: 44, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { backgroundColor: '#171717' },
  navText: { fontSize: 14, fontWeight: '700', color: '#525252' },
  navTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.7 },
});
