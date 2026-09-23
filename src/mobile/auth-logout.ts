export const MOBILE_LOGOUT_REDIRECT = 'enkhapp://auth/logout';

export class AuthGenerationGuard {
  private generation = 0;
  capture() { return this.generation; }
  invalidate() { this.generation += 1; return this.generation; }
  isCurrent(value: number) { return value === this.generation; }
}

export async function saveIfCurrent(guard: AuthGenerationGuard, generation: number,
  save: () => Promise<void>, erase: () => Promise<void>) {
  if (!guard.isCurrent(generation)) throw new Error('MOBILE_SIGN_IN_REQUIRED');
  await save();
  if (!guard.isCurrent(generation)) {
    await erase();
    throw new Error('MOBILE_SIGN_IN_REQUIRED');
  }
}

export function mobileLogoutUrl(issuer: string, clientId: string, redirect: string) {
  if (!/^https:\/\/[^/?#]+$/.test(issuer) || !/^[A-Za-z0-9_-]{8,128}$/.test(clientId) ||
      redirect !== MOBILE_LOGOUT_REDIRECT) throw new Error('MOBILE_LOGOUT_INVALID');
  const url = new URL('/v2/logout', `${issuer}/`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('returnTo', redirect);
  return url.toString();
}

type SignOutSteps = {
  invalidate(): void;
  readRefreshToken(): Promise<string | null>;
  deleteCredentials(): Promise<void>;
  afterLocalClear?(): Promise<void> | void;
  revokeRefreshToken(token: string): Promise<void>;
  closeBrowserSession(): Promise<void>;
};

export async function runLocalFirstSignOut(steps: SignOutSteps) {
  let refreshToken: string | null = null;
  try { refreshToken = await steps.readRefreshToken(); } catch { /* Local deletion still has priority. */ }
  steps.invalidate();
  await steps.deleteCredentials();
  await steps.afterLocalClear?.();
  let revoked = false;
  let browserLoggedOut = false;
  if (refreshToken) {
    try { await steps.revokeRefreshToken(refreshToken); revoked = true; } catch { /* Best effort. */ }
  }
  try { await steps.closeBrowserSession(); browserLoggedOut = true; } catch { /* Local sign-out is complete. */ }
  return { localCleared: true as const, revoked, browserLoggedOut };
}
