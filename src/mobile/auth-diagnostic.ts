export type MobileAuthStage = 'config' | 'secure_store' | 'discovery' | 'auth_request' |
  'browser_prompt' | 'token_exchange' | 'token_validation' | 'secure_store_save' | 'chat_pull';

type SafeErrorClass = 'Error' | 'TypeError' | 'Unknown';
const SAFE_CODES = new Set([
  'MOBILE_AUTH_NOT_CONFIGURED', 'MOBILE_SECURE_STORAGE_UNAVAILABLE',
  'MOBILE_AUTH_UNAVAILABLE', 'MOBILE_AUTH_CANCELLED', 'MOBILE_TOKEN_INVALID',
  'MOBILE_SIGN_IN_REQUIRED', 'NETWORK_UNAVAILABLE', 'INVALID_CHAT_API_BASE',
  'MALFORMED_CHAT_RESPONSE',
]);

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

  constructor(readonly stage: MobileAuthStage, error: unknown) {
    const errorClass = safeClass(error);
    const code = safeCode(error);
    super(`stage=${stage} class=${errorClass} code=${code}`);
    this.name = 'MobileAuthDiagnosticError';
    this.errorClass = errorClass;
    this.code = code;
  }
}

export async function atMobileAuthStage<T>(stage: MobileAuthStage, operation: () => T | Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) { throw new MobileAuthDiagnosticError(stage, error); }
}

export function formatMobileAuthDiagnostic(error: unknown, fallbackStage: MobileAuthStage): string {
  const diagnostic = error instanceof MobileAuthDiagnosticError ? error :
    new MobileAuthDiagnosticError(fallbackStage, error);
  return `stage=${diagnostic.stage} class=${diagnostic.errorClass} code=${diagnostic.code}`;
}
