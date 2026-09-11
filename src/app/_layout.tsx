import { Stack } from 'expo-router';

import { WorkspaceSyncBootstrap } from '../components/workspace-sync-status';
import { LanguageProvider } from '../i18n';
import '../global.css';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <WorkspaceSyncBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </LanguageProvider>
  );
}
