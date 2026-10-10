import { ChatApiError } from './chat-api';

export type ChatStartupStage = 'config' | 'account_key' | 'switchAccount' | 'retryPending' | 'retryDeletes' | 'pull';
const codes = new Set(['INVALID_CHAT_API_BASE', 'INVALID_LOCAL_ACCOUNT', 'LOCAL_CHAT_INVALID',
  'LOCAL_CHAT_FULL', 'CHAT_BUSY', 'MOBILE_SIGN_IN_REQUIRED', 'MOBILE_REAUTH_REQUIRED', 'MOBILE_TOKEN_INVALID',
  'MOBILE_SECURE_STORAGE_UNAVAILABLE', 'NETWORK_UNAVAILABLE', 'REQUEST_TIMEOUT',
  'MALFORMED_CHAT_RESPONSE', 'CHAT_REQUEST_FAILED', 'CHAT_SYNC_RESET_REQUIRED',
  'CHAT_SYNC_INVALID', 'CHAT_SYNC_PAGE_LIMIT', 'UNAUTHORIZED', 'FORBIDDEN']);

export function chatStartupDiagnostic(stage: ChatStartupStage, error: unknown): string {
  const api = error instanceof ChatApiError;
  const candidate = api ? error.code : error instanceof Error ? error.message : '';
  const code = codes.has(candidate) ? candidate : 'UNCLASSIFIED';
  const status = api && Number.isInteger(error.status) && error.status >= 0 && error.status <= 599
    ? error.status : null;
  const endpoint = api ? ({ retryPending: '/api/chat/turns', retryDeletes: '/api/chat/sync',
    pull: '/api/chat/changes' } as Partial<Record<ChatStartupStage, string>>)[stage] || 'none' : 'none';
  const source = api ? (status === 0 ? 'network_or_auth' : 'api_or_auth') :
    stage === 'switchAccount' || code.startsWith('LOCAL_') || code === 'INVALID_LOCAL_ACCOUNT'
      ? 'local_storage' : 'local_or_auth';
  return `stage=${stage} code=${code} status=${status ?? 'none'} endpoint=${endpoint} source=${source}`;
}
