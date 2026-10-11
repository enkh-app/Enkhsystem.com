import type { PlatformSummary } from './control-types';
export function platformAvailability(item?: PlatformSummary, now = Date.now()): 'unknown' | 'known' | 'stale' {
  if (!item || item.evidence === 'unknown') return 'unknown';
  const observed = Date.parse(item.updatedAt || '');
  const expires = Date.parse(item.evidenceExpiresAt || '');
  // Never invent a TTL. Expiry must be supplied with prior evidence by the server.
  if (Number.isFinite(observed) && observed <= now && Number.isFinite(expires) && expires >= observed && expires <= now)
    return 'stale';
  return 'known';
}
