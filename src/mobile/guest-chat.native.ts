import * as SecureStore from 'expo-secure-store';
import { ChatApiError, resolveMobileChatApiBase } from './chat-api';

const GUEST_TOKEN_KEY = 'enkh.mobile.guest-chat.v1';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

async function secureStoreReady() {
  if (!(await SecureStore.isAvailableAsync())) throw new ChatApiError(0, 'MOBILE_SECURE_STORAGE_UNAVAILABLE');
}

async function safeJson(response: Response) {
  let data: unknown;
  try { data = await response.json(); } catch { throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE'); }
  if (JSON.stringify(data).length > 100_000) throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
  return data;
}

export async function mobileGuestToken(transport: typeof fetch = fetch,
  apiBase = resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_API_URL),
  clientType: 'ios' | 'android' = 'ios') {
  await secureStoreReady();
  const stored = await SecureStore.getItemAsync(GUEST_TOKEN_KEY);
  if (stored && TOKEN.test(stored)) return stored;
  if (stored) await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY);
  let response: Response;
  try { response = await transport(`${apiBase}/api/chat/guest`, { method: 'POST', redirect: 'error',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Enkh-Client-Type': clientType },
    body: '{}' }); }
  catch { throw new ChatApiError(0, 'NETWORK_UNAVAILABLE'); }
  const data = await safeJson(response) as { guestToken?: unknown; error?: { code?: unknown } };
  if (!response.ok) throw new ChatApiError(response.status,
    typeof data.error?.code === 'string' ? data.error.code : 'CHAT_REQUEST_FAILED');
  if (typeof data.guestToken !== 'string' || !TOKEN.test(data.guestToken))
    throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
  await SecureStore.setItemAsync(GUEST_TOKEN_KEY, data.guestToken);
  return data.guestToken;
}

export async function claimMobileGuestChat(accessToken: () => Promise<string>, transport: typeof fetch = fetch,
  apiBase = resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_API_URL),
  clientType: 'ios' | 'android' = 'ios') {
  await secureStoreReady();
  const guestToken = await SecureStore.getItemAsync(GUEST_TOKEN_KEY);
  if (!guestToken) return false;
  if (!TOKEN.test(guestToken)) { await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY); return false; }
  const token = await accessToken();
  if (!token || /[\r\n]/.test(token)) throw new ChatApiError(401, 'MOBILE_SIGN_IN_REQUIRED');
  let response: Response;
  try { response = await transport(`${apiBase}/api/chat/guest/claim`, { method: 'POST', redirect: 'error',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json', 'X-Enkh-Client-Type': clientType },
    body: JSON.stringify({ guestToken }) }); }
  catch { throw new ChatApiError(0, 'NETWORK_UNAVAILABLE'); }
  const data = await safeJson(response) as { success?: unknown; error?: { code?: unknown } };
  if (!response.ok || data.success !== true) throw new ChatApiError(response.status,
    typeof data.error?.code === 'string' ? data.error.code : 'CHAT_REQUEST_FAILED');
  await SecureStore.deleteItemAsync(GUEST_TOKEN_KEY);
  return true;
}

export const mobileGuestAccountKey = 'guest-installation';
