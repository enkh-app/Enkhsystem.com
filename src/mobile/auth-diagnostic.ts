export type MobileAuthStage = 'config' | 'secure_store' | 'discovery' | 'auth_request' |
  'browser_prompt' | 'token_exchange' | 'token_validation' | 'secure_store_save' | 'chat_pull';

type SafeErrorClass = 'Error' | 'TypeError' | 'Unknown';
const SAFE_CODES = new Set([
  'MOBILE_AUTH_NOT_CONFIGURED', 'MOBILE_SECURE_STORAGE_UNAVAILABLE',
  'MOBILE_AUTH_UNAVAILABLE', 'MOBILE_TOKEN_INVALID',
  'MOBILE_AUTH_CANCEL', 'MOBILE_AUTH_DISMISS', 'MOBILE_AUTH_LOCKED',
  'MOBILE_AUTH_OAUTH_ERROR', 'MOBILE_AUTH_MISSING_CODE',
  'MOBILE_AUTH_MISSING_VERIFIER', 'MOBILE_AUTH_BROWSER_ERROR',
  'MOBILE_SIGN_IN_REQUIRED', 'NETWORK_UNAVAILABLE', 'INVALID_CHAT_API_BASE',
  'MALFORMED_CHAT_RESPONSE',
]);

export type MobileAuthPromptCode = 'MOBILE_AUTH_CANCEL' | 'MOBILE_AUTH_DISMISS' |
  'MOBILE_AUTH_LOCKED' | 'MOBILE_AUTH_OAUTH_ERROR' | 'MOBILE_AUTH_MISSING_CODE' |
  'MOBILE_AUTH_MISSING_VERIFIER' | 'MOBILE_AUTH_BROWSER_ERROR';

export function mobileAuthPromptFailureCode(result: unknown, hasVerifier: boolean): MobileAuthPromptCode | null {
  if (!result || typeof result !== 'object' || !('type' in result)) return 'MOBILE_AUTH_BROWSER_ERROR';
  switch (result.type) {
    case 'cancel': return 'MOBILE_AUTH_CANCEL';
    case 'dismiss': return 'MOBILE_AUTH_DISMISS';
    case 'locked': return 'MOBILE_AUTH_LOCKED';
    case 'error': return 'MOBILE_AUTH_OAUTH_ERROR';
    case 'success': {
      const params = 'params' in result ? result.params : null;
      if (!params || typeof params !== 'object' || !('code' in params) ||
          typeof params.code !== 'string' || !params.code) return 'MOBILE_AUTH_MISSING_CODE';
      return hasVerifier ? null : 'MOBILE_AUTH_MISSING_VERIFIER';
    }
    default: return 'MOBILE_AUTH_BROWSER_ERROR';
  }
}

function safeClass(error: unknown): SafeErrorClass {
  if (error instanceof TypeError) return 'TypeError';
  if (error instanceof Error) return 'Error';
  return 'Unknown';
}

function safeCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'UNCLASSIFIED';
  const candidate = 'code' in error ? error.code : error instanceof Error ? error.message : undefined;
  return typeof candidate === 'string' && SAFE_CODES.has(candidate) ? candidate : 'UNCLASSIFIED';
}

export class MobileAuthDiagnosticError extends Error {
  readonly errorClass: SafeErrorClass;
  readonly code: string;
  readonly redirectMatch?: boolean;

  constructor(readonly stage: MobileAuthStage, error: unknown, redirectMatch?: boolean) {
    const errorClass = safeClass(error);
    const code = safeCode(error);
    super(`stage=${stage} class=${errorClass} code=${code}${redirectMatch === undefined ? '' :
      ` redirectMatch=${redirectMatch}`}`);
    this.name = 'MobileAuthDiagnosticError';
    this.errorClass = errorClass;
    this.code = code;
    this.redirectMatch = redirectMatch;
  }
}

export async function atMobileAuthStage<T>(stage: MobileAuthStage, operation: () => T | Promise<T>,
  redirectMatch?: boolean): Promise<T> {
  try { return await operation(); }
  catch (error) { throw new MobileAuthDiagnosticError(stage, error, redirectMatch); }
}

export function formatMobileAuthDiagnostic(error: unknown, fallbackStage: MobileAuthStage): string {
  const diagnostic = error instanceof MobileAuthDiagnosticError ? error :
    new MobileAuthDiagnosticError(fallbackStage, error);
  return `stage=${diagnostic.stage} class=${diagnostic.errorClass} code=${diagnostic.code}${
    diagnostic.redirectMatch === undefined ? '' : ` redirectMatch=${diagnostic.redirectMatch}`}`;
}
