import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, View } from 'react-native';
import { NativeBottomNavigation } from './native-bottom-navigation.native';

export function AppShell({ children }: { children: ReactNode }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#F4F8FD' }}>
    <View style={{ flex: 1 }}><>{children}</></View>
    {!keyboardVisible && <NativeBottomNavigation />}
  </View>;
}
