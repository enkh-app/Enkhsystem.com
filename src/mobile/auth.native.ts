import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { mobileAuthConfig } from './auth-config';

const TOKEN_KEY = 'enkh.mobile.auth.v1';
type StoredTokens = { accessToken: string; refreshToken?: string; expiresAt: number };
let pendingRefresh: Promise<string> | null = null;

function config() {
  return mobileAuthConfig({
    EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL: process.env.EXPO_PUBLIC_AUTH0_ISSUER_BASE_URL,
    EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH0_MOBILE_CLIENT_ID,
    EXPO_PUBLIC_AUTH0_AUDIENCE: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
  });
}
function redirectUri() {
  return AuthSession.makeRedirectUri({ scheme: 'enkhapp', path: 'auth' });
}
function claims(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('MOBILE_TOKEN_INVALID');
  try { return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>; }
  catch { throw new Error('MOBILE_TOKEN_INVALID'); }
}
function checkToken(token: string, requireFresh = true) {
  const expected = config();
  const payload = claims(token);
  const audience = payload.aud;
  if (payload.iss !== `${expected.issuer}/` ||
    !(audience === expected.audience || (Array.isArray(audience) && audience.includes(expected.audience))) ||
    typeof payload.sub !== 'string' || !payload.sub || typeof payload.exp !== 'number' ||
    (requireFresh && payload.exp <= Date.now() / 1000))
    throw new Error('MOBILE_TOKEN_INVALID');
  return payload.sub;
}
async function readTokens(): Promise<StoredTokens | null> {
  if (!(await SecureStore.isAvailableAsync())) throw new Error('MOBILE_SECURE_STORAGE_UNAVAILABLE');
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredTokens; } catch { throw new Error('MOBILE_TOKEN_INVALID'); }
}
async function saveTokens(value: StoredTokens) {
  if (!(await SecureStore.isAvailableAsync())) throw new Error('MOBILE_SECURE_STORAGE_UNAVAILABLE');
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(value));
}

export async function mobileSignIn(): Promise<string> {
  const settings = config();
  if (!(await SecureStore.isAvailableAsync())) throw new Error('MOBILE_SECURE_STORAGE_UNAVAILABLE');
  const discovery = await AuthSession.fetchDiscoveryAsync(settings.issuer);
  if (!discovery.authorizationEndpoint || !discovery.tokenEndpoint) throw new Error('MOBILE_AUTH_UNAVAILABLE');
  const request = new AuthSession.AuthRequest({ clientId: settings.clientId, redirectUri: redirectUri(),
    responseType: AuthSession.ResponseType.Code, usePKCE: true,
    scopes: ['openid', 'profile', 'offline_access'], extraParams: { audience: settings.audience } });
  const response = await request.promptAsync(discovery);
  if (response.type !== 'success' || !response.params.code || !request.codeVerifier)
    throw new Error('MOBILE_AUTH_CANCELLED');
  const token = await AuthSession.exchangeCodeAsync({ clientId: settings.clientId,
    code: response.params.code, redirectUri: redirectUri(),
    extraParams: { code_verifier: request.codeVerifier } }, discovery);
  const sub = checkToken(token.accessToken);
  await saveTokens({ accessToken: token.accessToken, refreshToken: token.refreshToken,
    expiresAt: (token.issuedAt + (token.expiresIn || 0)) * 1000 });
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `enkh-mobile-owner:${sub}`);
}

export async function mobileAccessToken(): Promise<string> {
  const stored = await readTokens();
  if (!stored) throw new Error('MOBILE_SIGN_IN_REQUIRED');
  if (stored.expiresAt > Date.now() + 60000) { checkToken(stored.accessToken); return stored.accessToken; }
  if (!stored.refreshToken) throw new Error('MOBILE_SIGN_IN_REQUIRED');
  if (!pendingRefresh) pendingRefresh = (async () => {
    const settings = config();
    const discovery = await AuthSession.fetchDiscoveryAsync(settings.issuer);
    const fresh = await AuthSession.refreshAsync({ clientId: settings.clientId, refreshToken: stored.refreshToken! }, discovery);
    checkToken(fresh.accessToken);
    await saveTokens({ accessToken: fresh.accessToken, refreshToken: fresh.refreshToken || stored.refreshToken,
      expiresAt: (fresh.issuedAt + (fresh.expiresIn || 0)) * 1000 });
    return fresh.accessToken;
  })().finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}

export async function mobileAccountKey(): Promise<string | null> {
  try { const stored = await readTokens(); if (!stored) return null;
    const sub = checkToken(stored.accessToken, false);
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `enkh-mobile-owner:${sub}`); }
  catch { return null; }
}
export async function mobileSignOut() { await SecureStore.deleteItemAsync(TOKEN_KEY); }
