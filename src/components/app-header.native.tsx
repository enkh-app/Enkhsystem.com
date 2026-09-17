import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { languageOptions, useI18n } from '../i18n';

type ActiveRoute = 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status' | 'admin';

export function AppHeader({ active: _active }: { active?: ActiveRoute }) {
  const { language, setLanguage, t } = useI18n();
  const index = languageOptions.findIndex((item) => item.id === language);
  const next = languageOptions[(index + 1) % languageOptions.length];
  return <View style={styles.header}>
    <Pressable accessibilityRole="link" accessibilityLabel={t('brand.home')} onPress={() => router.navigate('/')}
      style={styles.brand}>
      <View accessibilityElementsHidden style={styles.mark}>
        <View style={[styles.fold, styles.top]} /><View style={[styles.fold, styles.middle]} />
        <View style={[styles.fold, styles.bottom]} /><View style={styles.spine} />
      </View>
      <View><Text style={styles.name}>ENKH AI</Text><Text style={styles.tagline}>YOUR WORK PARTNER</Text></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={t('language.label')}
      onPress={() => setLanguage(next.id)} style={styles.language}>
      <Text style={styles.languageText}>{languageOptions[index]?.short || 'MN'}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E3ECF7' },
  brand: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 34, height: 36, position: 'relative' },
  fold: { position: 'absolute', left: 8, width: 23, height: 7, borderRadius: 2,
    transform: [{ skewX: '-23deg' }] },
  top: { top: 3, backgroundColor: '#17C9ED' },
  middle: { top: 14, width: 19, backgroundColor: '#168DE8' },
  bottom: { top: 25, backgroundColor: '#1554D1' },
  spine: { position: 'absolute', left: 2, top: 5, width: 8, height: 29, borderRadius: 2,
    backgroundColor: '#0C66DC', transform: [{ skewY: '-18deg' }] },
  name: { fontSize: 15, fontWeight: '900', letterSpacing: 1.8, color: '#102A43' },
  tagline: { marginTop: 2, fontSize: 6, fontWeight: '800', letterSpacing: 1.2, color: '#7290B2' },
  language: { minWidth: 48, minHeight: 44, borderRadius: 12, backgroundColor: '#EEF5FE',
    alignItems: 'center', justifyContent: 'center' },
  languageText: { color: '#0B57D0', fontSize: 12, fontWeight: '900' },
});
