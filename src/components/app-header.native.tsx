import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { languageOptions, useI18n } from '../i18n';

type ActiveRoute = 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status' | 'admin';
type AppHeaderProps = {
  active?: ActiveRoute;
  onBack?: () => void;
  onHistory?: () => void;
  onNewChat?: () => void;
};

export function AppHeader({ active: _active, onBack, onHistory, onNewChat }: AppHeaderProps) {
  const { language, setLanguage, t } = useI18n();
  const index = languageOptions.findIndex((item) => item.id === language);
  const next = languageOptions[(index + 1) % languageOptions.length];
  return <View style={styles.header}>
    <View style={styles.leading}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Буцах"
        onPress={onBack} style={styles.backButton}><Text style={styles.backIcon}>‹</Text></Pressable> : null}
      <Pressable accessibilityRole="link" accessibilityLabel={t('brand.home')} onPress={() => router.navigate('/')}
        style={styles.brand}>
        <Image accessibilityIgnoresInvertColors source={require('../../assets/images/enkh-ios-icon.png')}
          resizeMode="contain" style={styles.logo} />
        <Text style={styles.name}>ENKH AI</Text>
      </Pressable>
    </View>
    <View style={styles.actions}>
      {onHistory ? <Pressable accessibilityRole="button" accessibilityLabel="Ярианы түүх"
        onPress={onHistory} style={styles.iconButton}><Text style={styles.historyIcon}>◷</Text></Pressable> : null}
      {onNewChat ? <Pressable accessibilityRole="button" accessibilityLabel="Шинэ чат"
        onPress={onNewChat} style={styles.iconButton}><Text style={styles.plusIcon}>＋</Text></Pressable> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t('language.label')}
        onPress={() => setLanguage(next.id)} style={styles.language}>
        <Text style={styles.languageText}>{languageOptions[index]?.short || 'MN'}</Text>
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF1F6' },
  leading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 3 },
  backButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  backIcon: { marginTop: -2, color: '#49637F', fontSize: 34, lineHeight: 36, fontWeight: '400' },
  brand: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#F4F7FB' },
  name: { fontSize: 15, fontWeight: '900', letterSpacing: 1.5, color: '#0B1F33' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#E1E8F0' },
  historyIcon: { color: '#49637F', fontSize: 22, lineHeight: 24, fontWeight: '700' },
  plusIcon: { color: '#0B57D0', fontSize: 22, lineHeight: 24, fontWeight: '700' },
  language: { minWidth: 42, height: 38, borderRadius: 11, backgroundColor: '#F7F9FC',
    borderWidth: 1, borderColor: '#E1E8F0', alignItems: 'center', justifyContent: 'center' },
  languageText: { color: '#49637F', fontSize: 12, fontWeight: '900' },
});
