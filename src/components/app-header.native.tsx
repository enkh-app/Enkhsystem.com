import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { languageOptions, useI18n } from '../i18n';
import { nativePrimaryRoute, nativePrimaryRoutes } from './native-navigation-model';

type ActiveRoute = 'home' | 'chat' | 'search' | 'workspace' | 'tools' | 'account' | 'status' | 'admin';
type AppHeaderProps = {
  active?: ActiveRoute;
  onBack?: () => void;
  onHistory?: () => void;
  onNewChat?: () => void;
};

export function AppHeader({ active: _active, onBack, onHistory, onNewChat }: AppHeaderProps) {
  const { language, setLanguage, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentRoute = nativePrimaryRoute(usePathname());
  const index = languageOptions.findIndex((item) => item.id === language);
  const next = languageOptions[(index + 1) % languageOptions.length];
  return <View style={styles.header}>
    <View style={styles.leading}>
      <Pressable accessibilityRole="button" accessibilityLabel="Үндсэн цэс" accessibilityState={{ expanded: menuOpen }}
        onPress={() => setMenuOpen(true)} style={styles.menuButton}>
        <Text accessibilityElementsHidden style={styles.menuIcon}>☰</Text>
      </Pressable>
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
    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.menuOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Цэсийг хаах"
          onPress={() => setMenuOpen(false)} style={styles.menuBackdrop} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.menuPanel} accessibilityViewIsModal>
          <View style={styles.menuHeading}>
            <Text accessibilityRole="header" style={styles.menuTitle}>ENKH AI</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Цэсийг хаах"
              onPress={() => setMenuOpen(false)} style={styles.menuClose}>
              <Text style={styles.menuCloseText}>×</Text>
            </Pressable>
          </View>
          {nativePrimaryRoutes.map((item) => <Pressable key={item.href} accessibilityRole="link"
            accessibilityLabel={item.href === '/chat' ? 'Хүмүүсийн чат' : item.label}
            accessibilityState={{ selected: currentRoute === item.href }}
            onPress={() => { setMenuOpen(false); router.navigate(item.href); }}
            style={[styles.menuItem, currentRoute === item.href && styles.menuItemSelected]}>
            <Text accessibilityElementsHidden style={styles.menuItemIcon}>{item.icon}</Text>
            <Text style={[styles.menuItemText, currentRoute === item.href && styles.menuItemTextSelected]}>
              {item.href === '/chat' ? 'Хүмүүсийн чат' : item.label}
            </Text>
          </Pressable>)}
        </SafeAreaView>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 50, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDF1F6' },
  leading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  menuIcon: { color: '#243B53', fontSize: 22, lineHeight: 27 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  backIcon: { marginTop: -2, color: '#49637F', fontSize: 32, lineHeight: 34, fontWeight: '400' },
  brand: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F4F7FB' },
  name: { fontSize: 13, fontWeight: '900', letterSpacing: 1.3, color: '#0B1F33' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#E1E8F0' },
  historyIcon: { color: '#49637F', fontSize: 21, lineHeight: 23, fontWeight: '700' },
  plusIcon: { color: '#0B57D0', fontSize: 21, lineHeight: 23, fontWeight: '700' },
  language: { minWidth: 44, height: 44, borderRadius: 12, backgroundColor: '#F7F9FC',
    borderWidth: 1, borderColor: '#E1E8F0', alignItems: 'center', justifyContent: 'center' },
  languageText: { color: '#49637F', fontSize: 12, fontWeight: '900' },
  menuOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(9, 26, 44, 0.42)' },
  menuBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  menuPanel: { width: '82%', maxWidth: 320, height: '100%', paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  menuHeading: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#E1E8F0', marginBottom: 12 },
  menuTitle: { color: '#102A43', fontSize: 19, fontWeight: '900' },
  menuClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  menuCloseText: { color: '#49637F', fontSize: 29, lineHeight: 34 },
  menuItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, borderRadius: 12 },
  menuItemSelected: { backgroundColor: '#E5EFFF' },
  menuItemIcon: { width: 22, color: '#49637F', fontSize: 21 },
  menuItemText: { color: '#243B53', fontSize: 16, fontWeight: '700' },
  menuItemTextSelected: { color: '#0B57D0' },
});
