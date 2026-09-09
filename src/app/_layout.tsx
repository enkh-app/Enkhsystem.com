import { Stack } from 'expo-router';

import { WorkspaceSyncBootstrap } from '../components/workspace-sync-status';

export default function RootLayout() {
  return (
    <>
      <WorkspaceSyncBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
