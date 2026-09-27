import { Redirect } from 'expo-router';

// Expo Router requires a non-platform route beside [userId].native.tsx.
// Web keeps its existing admin users experience; native resolves the detail screen.
export default function AdminUserDetailFallback() {
  return <Redirect href="/admin/users" />;
}
