import { Stack } from 'expo-router';

import { WorkspaceSyncBootstrap } from '../components/workspace-sync-status';
import { AppShell } from '../components/app-shell';
import { LanguageProvider } from '../i18n';
import '../global.css';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <WorkspaceSyncBootstrap />
      <AppShell>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppShell>
    </LanguageProvider>
  );
}
