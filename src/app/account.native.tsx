import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';
import { mobileAccountKey, mobileProfile, mobileSetPreferredName } from '../mobile/auth.native';
import { useI18n } from '../i18n';

export default function NativeAccountScreen() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState('');
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([mobileAccountKey(), mobileProfile()]).then(([accountKey, profile]) => {
      if (!active) return;
      setSignedIn(!!accountKey);
      setAccountName(profile.displayName);
      setPreferredName(profile.preferredName || '');
    });
    return () => { active = false; };
  }, []));

  const saveName = async () => {
    const value = await mobileSetPreferredName(preferredName);
    setPreferredName(value || '');
    setSaved(true);
  };

  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="account" />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>{t('account.title')}</Text>
      <Text style={styles.subtitle}>Таны mobile ENKH тохиргоо.</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(preferredName || accountName || 'Э').slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.cardTitle}>{signedIn ? 'Mobile Chat-д нэвтэрсэн' : 'Mobile Chat-д нэвтрээгүй'}</Text>
        {accountName ? <Text style={styles.accountName}>Бүртгэлийн нэр: {accountName}</Text> : null}
        <Text style={styles.label}>Энх таныг юу гэж дуудах вэ?</Text>
        <TextInput accessibilityLabel="Дуудах нэр" value={preferredName}
          onChangeText={(value) => { setPreferredName(value); setSaved(false); }}
          maxLength={40} placeholder={accountName || 'Жишээ: Nasa'} placeholderTextColor="#829AB1" style={styles.input} />
        <Pressable accessibilityRole="button" onPress={saveName} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Text style={styles.saveButtonText}>Нэр хадгалах</Text>
        </Pressable>
        {saved ? <Text accessibilityLiveRegion="polite" style={styles.saved}>Хадгаллаа. Нүүр хуудас дээр шинэ нэр харагдана.</Text> : null}
        <Text style={styles.body}>Хоосон хадгалбал бүртгэлтэй нэрийг ашиглана. Нэвтрэх болон гарах үйлдлийг Chat хэсгээс удирдана.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/chat')} style={styles.chatButton}>
          <Text style={styles.chatButtonText}>{t('nav.chat')}  →</Text>
        </Pressable>
      </View>
      <View style={styles.moreCard}>
        <Text accessibilityRole="header" style={styles.moreTitle}>Бусад</Text>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/workspace')} style={styles.moreLink}>
          <Text style={styles.moreIcon}>◷</Text><Text style={styles.moreText}>Workspace ба ярианы түүх</Text><Text style={styles.moreArrow}>›</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.navigate('/tools')} style={styles.moreLink}>
          <Text style={styles.moreIcon}>∑</Text><Text style={styles.moreText}>Tools</Text><Text style={styles.moreArrow}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 32 },
  title: { color: '#102A43', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 5, color: '#627D98', fontSize: 14 },
  card: { marginTop: 22, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: '#DFEAF7' },
  avatar: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#2F6FE4',
    alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  cardTitle: { marginTop: 16, color: '#102A43', fontSize: 18, fontWeight: '900' },
  accountName: { marginTop: 6, color: '#627D98', fontSize: 13 },
  label: { marginTop: 20, marginBottom: 7, color: '#243B53', fontSize: 14, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: '#CAD7E5',
    backgroundColor: '#FAFCFE', color: '#102A43', fontSize: 16 },
  saveButton: { minHeight: 48, marginTop: 12, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: '#2F6FE4' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '900' },
  saved: { marginTop: 9, color: '#147D4A', fontSize: 12, lineHeight: 18 },
  body: { marginTop: 16, color: '#627D98', fontSize: 14, lineHeight: 21 },
  chatButton: { alignSelf: 'flex-start', minHeight: 48, marginTop: 18, paddingHorizontal: 18,
    justifyContent: 'center', borderRadius: 13, backgroundColor: '#102A43' },
  chatButtonText: { color: '#FFFFFF', fontWeight: '900' },
  moreCard: { marginTop: 16, padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#DFEAF7' },
  moreTitle: { marginBottom: 6, color: '#102A43', fontSize: 17, fontWeight: '900' },
  moreLink: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: '#EDF3F9' },
  moreIcon: { width: 24, color: '#1769E0', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  moreText: { flex: 1, color: '#243B53', fontSize: 14, fontWeight: '800' },
  moreArrow: { color: '#829AB1', fontSize: 23 },
  pressed: { opacity: 0.72 },
});