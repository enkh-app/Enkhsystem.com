import type { ReactNode } from 'react';
import { View } from 'react-native';

export function AppShell({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: '#F4F8FD' }}>
    <View style={{ flex: 1 }}><>{children}</></View>
  </View>;
}
