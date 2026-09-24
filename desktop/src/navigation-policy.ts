export const ENKH_APP_URL = 'https://enkhsystems.com';
export const DEFAULT_AUTH0_ORIGIN = 'https://dev-4fxiys6k3ogwhhfl.us.auth0.com';

const REQUIRED_ENKH_ORIGINS = new Set([
  'https://enkhsystems.com',
  'https://api.enkhsystems.com',
]);

const REQUIRED_GOOGLE_AUTH_ORIGINS = new Set([
  'https://accounts.google.com',
]);

export type NavigationPolicy = Readonly<{
  appUrl: string;
  internalOrigins: ReadonlySet<string>;
}>;

function strictHttpsOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('INVALID_DESKTOP_ORIGIN');
  }
  return url.origin;
}

export function createNavigationPolicy(auth0Origin = DEFAULT_AUTH0_ORIGIN): NavigationPolicy {
  const verifiedAuth0Origin = strictHttpsOrigin(auth0Origin);
  return Object.freeze({
    appUrl: ENKH_APP_URL,
    internalOrigins: new Set([
      ...REQUIRED_ENKH_ORIGINS,
      ...REQUIRED_GOOGLE_AUTH_ORIGINS,
      verifiedAuth0Origin,
    ]),
  });
}

export function isAllowedNavigation(rawUrl: string, policy: NavigationPolicy): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && !url.username && !url.password &&
      policy.internalOrigins.has(url.origin);
  } catch {
    return false;
  }
}

export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.username || url.password) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'mailto:' && !url.search && !url.hash;
  } catch {
    return false;
  }
}
