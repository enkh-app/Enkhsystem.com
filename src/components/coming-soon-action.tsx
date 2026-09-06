import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from './app-header';

export function ComingSoonAction({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="actions" />
      <View style={styles.content}>
        <Text style={styles.badge}>ТУН УДАХГҮЙ</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.description}>Энэ боломж prototype төлөвт байна. Production үйлдэл бэлэн болмогц эндээс ажиллана.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/actions')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Actions руу буцах</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F5' },
  content: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', padding: 24 },
  badge: { fontSize: 11, letterSpacing: 2, fontWeight: '900', color: '#777' },
  title: { marginTop: 16, fontSize: 36, lineHeight: 44, fontWeight: '900', color: '#171717', textAlign: 'center' },
  description: { marginTop: 14, maxWidth: 540, fontSize: 16, lineHeight: 24, color: '#686868', textAlign: 'center' },
  button: { marginTop: 26, minHeight: 48, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#171717' },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
