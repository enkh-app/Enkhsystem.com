import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { nativePrimaryRoute, nativePrimaryRoutes } from './native-navigation-model';

export function NativeBottomNavigation() {
  const active = nativePrimaryRoute(usePathname());
  return <SafeAreaView edges={['bottom']} style={styles.safe}>
    <View accessibilityRole="tablist" style={styles.row}>
      {nativePrimaryRoutes.map((item) => <Pressable key={item.href} accessibilityRole="tab"
        accessibilityLabel={item.label} accessibilityState={{ selected: active === item.href }}
        onPress={() => router.navigate(item.href)} style={styles.item}>
        <Text style={[styles.icon, active === item.href && styles.selected]}>{item.icon}</Text>
        <Text numberOfLines={1} style={[styles.label, active === item.href && styles.selected]}>{item.label}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DDE8F8' },
  row: { minHeight: 58, flexDirection: 'row', paddingHorizontal: 4 },
  item: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 21, color: '#7590AC' },
  label: { fontSize: 10, fontWeight: '700', color: '#7590AC' },
  selected: { color: '#0B57D0' },
});
