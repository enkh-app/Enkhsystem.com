export class MobileAdminApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export type MobileAdminOverview = {
  readOnly: true;
  database: { status: string };
  accounts: { withWorkspace: number };
  workspaces: { records: number; bytes: number; updated24h: number };
  reminders: { total: number; scheduled: number; processing: number; delivered: number; failed: number; cancelled: number };
  activity: { messengerActiveMessages: number; messengerMessages24h: number; workspacesUpdated24h: number };
};
export type MobileAdminUser = { id: string; displayName: string; email: string; status: 'active' | 'suspended';
  createdAt: string; lastActivityAt: string | null };
export type MobileAdminUserDetail = { user: MobileAdminUser;
  workspace: { exists: boolean; revision: number | null; updatedAt: string | null; bytes: number };
  reminders: { total: number; scheduled: number; processing: number; delivered: number; failed: number; cancelled: number } };

type MobileAdminAccessProbe = { overview: () => Promise<MobileAdminOverview> };

export async function mobileAdminAccessAllowed(api: MobileAdminAccessProbe): Promise<boolean> {
  try { await api.overview(); return true; }
  catch { return false; }
}

const API_ORIGIN = 'https://api.enkhsystems.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const number = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
const text = (value: unknown, max = 256) => typeof value === 'string' && value.length <= max;
const date = (value: unknown) => value === null || (text(value, 64) && !Number.isNaN(Date.parse(value as string)));
const requiredDate = (value: unknown) => text(value, 64) && !Number.isNaN(Date.parse(value as string));

function validUser(value: unknown): value is MobileAdminUser {
  const user = value as MobileAdminUser;
  return !!user && UUID.test(user.id || '') && text(user.displayName, 200) && text(user.email, 320) &&
    ['active', 'suspended'].includes(user.status) && requiredDate(user.createdAt) && date(user.lastActivityAt);
}
function validCounts(value: unknown, keys: string[]) {
  const row = value as Record<string, unknown>;
  return !!row && keys.every((key) => number(row[key]));
}

export function createMobileAdminApi(token: () => Promise<string>, transport: typeof fetch = fetch) {
  async function request(path: string) {
    const accessToken = await token();
    if (!accessToken || /[\r\n]/.test(accessToken)) throw new MobileAdminApiError(401, 'MOBILE_SIGN_IN_REQUIRED');
    let response: Response;
    try { response = await transport(`${API_ORIGIN}${path}`, { method: 'GET', redirect: 'error',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Enkh-Client-Type': 'ios' } }); }
    catch { throw new MobileAdminApiError(0, 'NETWORK_UNAVAILABLE'); }
    let data: unknown;
    try { data = await response.json(); } catch { throw new MobileAdminApiError(502, 'MALFORMED_ADMIN_RESPONSE'); }
    if (JSON.stringify(data).length > 500_000) throw new MobileAdminApiError(502, 'MALFORMED_ADMIN_RESPONSE');
    if (!response.ok) {
      const code = (data as { error?: { code?: unknown } })?.error?.code;
      throw new MobileAdminApiError(response.status, typeof code === 'string' ? code : 'ADMIN_REQUEST_FAILED');
    }
    return data as Record<string, unknown>;
  }
  return {
    overview: async () => {
      const payload = await request('/api/admin/overview'); const data = payload.data as MobileAdminOverview;
      if (payload.success !== true || data?.readOnly !== true || !text(data.database?.status, 64) ||
        !validCounts(data.accounts, ['withWorkspace']) || !validCounts(data.workspaces, ['records', 'bytes', 'updated24h']) ||
        !validCounts(data.reminders, ['total', 'scheduled', 'processing', 'delivered', 'failed', 'cancelled']) ||
        !validCounts(data.activity, ['messengerActiveMessages', 'messengerMessages24h', 'workspacesUpdated24h']))
        throw new MobileAdminApiError(502, 'MALFORMED_ADMIN_RESPONSE');
      return data;
    },
    users: async () => {
      const payload = await request('/api/admin/users');
      if (payload.success !== true || !Array.isArray(payload.users) || payload.users.length > 1000 ||
        payload.users.some((user) => !validUser(user))) throw new MobileAdminApiError(502, 'MALFORMED_ADMIN_RESPONSE');
      return payload.users as MobileAdminUser[];
    },
    user: async (id: string) => {
      if (!UUID.test(id)) throw new MobileAdminApiError(404, 'ADMIN_USER_NOT_FOUND');
      const payload = await request(`/api/admin/users/${id}`); const data = payload.data as MobileAdminUserDetail;
      if (payload.success !== true || !data || !validUser(data.user) || data.user.id !== id ||
        typeof data.workspace?.exists !== 'boolean' || (data.workspace.revision !== null && !number(data.workspace.revision)) ||
        !date(data.workspace.updatedAt) || !number(data.workspace.bytes) ||
        !validCounts(data.reminders, ['total', 'scheduled', 'processing', 'delivered', 'failed', 'cancelled']))
        throw new MobileAdminApiError(502, 'MALFORMED_ADMIN_RESPONSE');
      return data;
    },
  };
}
