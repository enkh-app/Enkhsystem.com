import { ENKH_API_URL, AdminApiError } from '../api';
import type { ControlSnapshot } from './control-types';

export type ControlAvailability =
  | { available: true; snapshot: ControlSnapshot }
  | { available: false; reason: 'not-deployed' | 'unauthorized' | 'unavailable' };

export async function getControlSnapshot(): Promise<ControlAvailability> {
  try {
    const response = await fetch(`${ENKH_API_URL}/api/admin/control`, {
      method: 'GET', credentials: 'include', headers: { Accept: 'application/json' },
    });
    if (response.status === 404) return { available: false, reason: 'not-deployed' };
    if (response.status === 401 || response.status === 403) return { available: false, reason: 'unauthorized' };
    if (!response.ok) return { available: false, reason: 'unavailable' };
    const payload = await response.json();
    if (!payload?.success || !payload.data || !Array.isArray(payload.data.platforms) || !Array.isArray(payload.data.releases)) {
      return { available: false, reason: 'unavailable' };
    }
    return { available: true, snapshot: payload.data as ControlSnapshot };
  } catch {
    return { available: false, reason: 'unavailable' };
  }
}

export function assertAdminAccess(status: number): never {
  throw new AdminApiError(status);
}
