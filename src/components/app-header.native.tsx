import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { languageOptions, useI18n } from '../i18n';

type ActiveRoute = 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status' | 'admin';

export function AppHeader({ active: _active }: { active?: ActiveRoute }) {
  const { language, setLanguage, t } = useI18n();
  const index = languageOptions.findIndex((item) => item.id === language);
  const next = languageOptions[(index + 1) % languageOptions.length];
  return <View style={styles.header}>
    <Pressable accessibilityRole="link" accessibilityLabel={t('brand.home')} onPress={() => router.navigate('/')}
      style={styles.brand}>
      <Image
        accessibilityIgnoresInvertColors
        source={require('../../assets/images/enkh-ios-icon.png')}
        resizeMode="contain"
        style={styles.logo}
      />
      <Text style={styles.name}>ENKH AI</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={t('language.label')}
      onPress={() => setLanguage(next.id)} style={styles.language}>
      <Text style={styles.languageText}>{languageOptions[index]?.short || 'MN'}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF1F6' },
  brand: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconTile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#E9EEF5' },
  logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F4F7FB' },
  mark: { width: 30, height: 33, position: 'relative' },
  fold: { position: 'absolute', left: 7, width: 21, height: 7, borderRadius: 2,
    transform: [{ skewX: '-23deg' }] },
  top: { top: 2, backgroundColor: '#2F6FE4' },
  middle: { top: 13, width: 17, backgroundColor: '#2F6FE4' },
  bottom: { top: 24, width: 22, backgroundColor: '#2F6FE4' },
  spine: { position: 'absolute', left: 2, top: 3, width: 7, height: 28, borderRadius: 3,
    backgroundColor: '#2F6FE4', transform: [{ skewY: '-18deg' }] },
  name: { fontSize: 16, fontWeight: '900', letterSpacing: 1.8, color: '#0B1F33' },
  tagline: { marginTop: 3, fontSize: 6, fontWeight: '800', letterSpacing: 1.2, color: '#98A8BA' },
  language: { minWidth: 42, minHeight: 38, borderRadius: 12, backgroundColor: '#F7F9FC',
    borderWidth: 1, borderColor: '#E1E8F0',
    alignItems: 'center', justifyContent: 'center' },
  languageText: { color: '#49637F', fontSize: 12, fontWeight: '900' },
});