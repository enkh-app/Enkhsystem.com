export type MobileAuthConfig = { issuer: string; clientId: string; audience: string; apiBase: string };

export function mobileAuthConfig(env: Record<string, string | undefined>): MobileAuthConfig {
  const issuer = env.EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL?.trim().replace(/\/+$/, '') || '';
  const clientId = env.EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID?.trim() || '';
  const audience = env.EXPO_PUBLIC_AUTH0_AUDIENCE?.trim() || '';
  if (!/^https:\/\/[^/?#]+$/.test(issuer) || !/^[A-Za-z0-9_-]{8,128}$/.test(clientId) ||
      !/^https:\/\/[^\s]+$/.test(audience)) throw new Error('MOBILE_AUTH_NOT_CONFIGURED');
  return { issuer, clientId, audience, apiBase: 'https://api.enkhsystems.com' };
}
