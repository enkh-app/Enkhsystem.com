import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { mobileAuthConfig } from './auth-config';
import { atMobileAuthStage, mobileAuthPromptFailureCode } from './auth-diagnostic';

const TOKEN_KEY = 'enkh.mobile.auth.v1';
const PREFERRED_NAME_KEY = 'enkh.mobile.preferred-name.v1';
type StoredTokens = { accessToken: string; refreshToken?: string; expiresAt: number; displayName?: string };
export type MobileProfile = { signedIn: boolean; displayName: string | null; preferredName: string | null; greetingName: string | null };
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
function claimText(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function tokenDisplayName(idToken?: string) {
  if (!idToken) return null;
  try {
    const payload = claims(idToken);
    return claimText(payload, 'name') || claimText(payload, 'preferred_username') ||
      claimText(payload, 'nickname') || claimText(payload, 'given_name');
  } catch { return null; }
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
async function secureStoreReady() {
  if (!(await SecureStore.isAvailableAsync())) throw new Error('MOBILE_SECURE_STORAGE_UNAVAILABLE');
}
async function readTokens(): Promise<StoredTokens | null> {
  await secureStoreReady();
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredTokens; } catch { throw new Error('MOBILE_TOKEN_INVALID'); }
}
async function saveTokens(value: StoredTokens) {
  await secureStoreReady();
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(value));
}

export async function mobileSignIn(): Promise<string> {
  const settings = await atMobileAuthStage('config', config);
  await atMobileAuthStage('secure_store', secureStoreReady);
  const discovery = await atMobileAuthStage('discovery', async () => {
    const result = await AuthSession.fetchDiscoveryAsync(settings.issuer);
    if (!result.authorizationEndpoint || !result.tokenEndpoint) throw new Error('MOBILE_AUTH_UNAVAILABLE');
    return result;
  });
  const redirect = await atMobileAuthStage('auth_request', redirectUri);
  const redirectMatch = redirect === 'enkhapp://auth';
  const request = await atMobileAuthStage('auth_request', () => new AuthSession.AuthRequest({
    clientId: settings.clientId, redirectUri: redirect,
    responseType: AuthSession.ResponseType.Code, usePKCE: true,
    scopes: ['openid', 'profile', 'offline_access'], extraParams: { audience: settings.audience },
  }), redirectMatch);
  const response = await atMobileAuthStage('browser_prompt', async () => {
    const result = await request.promptAsync(discovery);
    const failureCode = mobileAuthPromptFailureCode(result, !!request.codeVerifier);
    if (failureCode) throw new Error(failureCode);
    if (result.type !== 'success') throw new Error('MOBILE_AUTH_BROWSER_ERROR');
    return result;
  }, redirectMatch);
  const token = await atMobileAuthStage('token_exchange', () => AuthSession.exchangeCodeAsync({
    clientId: settings.clientId, code: response.params.code, redirectUri: redirect,
    extraParams: { code_verifier: request.codeVerifier! },
  }, discovery));
  const sub = await atMobileAuthStage('token_validation', () => checkToken(token.accessToken));
  await atMobileAuthStage('secure_store_save', () => saveTokens({
    accessToken: token.accessToken, refreshToken: token.refreshToken,
    expiresAt: (token.issuedAt + (token.expiresIn || 0)) * 1000,
    displayName: tokenDisplayName(token.idToken) || undefined,
  }));
  return atMobileAuthStage('token_validation', () =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `enkh-mobile-owner:${sub}`));
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
      expiresAt: (fresh.issuedAt + (fresh.expiresIn || 0)) * 1000,
      displayName: tokenDisplayName(fresh.idToken) || stored.displayName });
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

export async function mobileProfile(): Promise<MobileProfile> {
  await secureStoreReady();
  const preferredName = (await SecureStore.getItemAsync(PREFERRED_NAME_KEY))?.trim() || null;
  try {
    const stored = await readTokens();
    if (!stored) return { signedIn: false, displayName: null, preferredName, greetingName: preferredName };
    checkToken(stored.accessToken, false);
    return { signedIn: true, displayName: stored.displayName || null, preferredName,
      greetingName: preferredName || stored.displayName || null };
  } catch {
    return { signedIn: false, displayName: null, preferredName, greetingName: preferredName };
  }
}

export async function mobileSetPreferredName(value: string) {
  await secureStoreReady();
  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, 40);
  if (normalized) await SecureStore.setItemAsync(PREFERRED_NAME_KEY, normalized);
  else await SecureStore.deleteItemAsync(PREFERRED_NAME_KEY);
  return normalized || null;
}

export async function mobileSignOut() { await SecureStore.deleteItemAsync(TOKEN_KEY); }
