import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';
import { mobileAccountKey } from '../mobile/auth.native';
import { useI18n } from '../i18n';

export default function NativeAccountScreen() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    void mobileAccountKey().then((key) => { if (active) setSignedIn(!!key); });
    return () => { active = false; };
  }, []));
  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="account" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{t('account.title')}</Text>
      <Text style={styles.subtitle}>Таны mobile ENKH тохиргоо.</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>Э</Text></View>
        <Text style={styles.cardTitle}>{signedIn ? 'Mobile Chat-д нэвтэрсэн' : 'Mobile Chat-д нэвтрээгүй'}</Text>
        <Text style={styles.body}>Нэвтрэх болон гарах үйлдлийг Chat хэсгээс удирдана. Local ажлууд төхөөрөмж дээрээ хадгалагдана.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/chat')} style={styles.button}>
          <Text style={styles.buttonText}>{t('nav.chat')}  →</Text>
        </Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 32 },
  title: { color: '#102A43', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 5, color: '#627D98', fontSize: 14 },
  card: { marginTop: 22, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: '#DFEAF7' },
  avatar: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#0B57D0',
    alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  cardTitle: { marginTop: 16, color: '#102A43', fontSize: 18, fontWeight: '900' },
  body: { marginTop: 8, color: '#627D98', fontSize: 14, lineHeight: 21 },
  button: { alignSelf: 'flex-start', minHeight: 48, marginTop: 18, paddingHorizontal: 18,
    justifyContent: 'center', borderRadius: 13, backgroundColor: '#0B57D0' },
  buttonText: { color: '#FFFFFF', fontWeight: '900' },
});
