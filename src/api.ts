const LOCAL_ENKH_API_URL = 'http://localhost:3000';
const PRODUCTION_ENKH_API_URL = 'https://api.enkhsystems.com';

const configuredApiUrl = process.env.EXPO_PUBLIC_ENKH_API_URL?.trim();

export const ENKH_API_URL = (
  __DEV__ ? configuredApiUrl || LOCAL_ENKH_API_URL : PRODUCTION_ENKH_API_URL
).replace(/\/$/, '');

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SearchSource = {
  title: string;
  url: string;
  source?: string;
};

export type ActionResultData = {
  type?: string;
  answer?: string;
  sources?: SearchSource[];
  expression?: string;
  value?: number;
  unit?: string;
  formatted?: string;
};

export type ActionResponse = {
  success: boolean;
  actionId?: string;
  status?: string;
  requestId?: string;
  message: string;
  response?: string;
  content?: string;
  data?: {
    actionId?: string;
    input?: string;
    title?: string;
    executedAt?: string;
    result?: ActionResultData;
  };
};

export type DashboardBreakdown = { label: string; count: number };
export type AdminDashboardData = {
  overview: { knowledgeVectors: number; chatMessages: number; distinctSessions: number; sources: number; systemHealth: string };
  knowledge: {
    collections: DashboardBreakdown[];
    sources: DashboardBreakdown[];
    categories: DashboardBreakdown[];
    languages: DashboardBreakdown[];
    latest: { title: string; source: string; category: string; language: string; ingestedAt: string }[];
  };
  toolUsage: Record<'knowledge_base' | 'google_search' | 'wikipedia_search' | 'deepseek_china', number>;
  memory: { totalMessages: number; distinctSessions: number };
  health: { status: string; readOnly: boolean; generatedAt: string };
};

export class AdminApiError extends Error {
  constructor(public status: number) { super(`Admin API error: ${status}`); }
}

export class ActionApiError extends Error {
  constructor(public status: number) { super(`Action API error: ${status}`); }
}

export type AuthUser = { accountId?: string; name: string; email: string; picture: string };
export type AuthState = { authenticated: boolean; admin: boolean; user?: AuthUser };

export async function getAuthState(): Promise<AuthState> {
  const response = await fetch(`${ENKH_API_URL}/auth/me`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  if (response.status === 401) return { authenticated: false, admin: false };
  if (!response.ok) throw new Error(`Auth API error: ${response.status}`);
  const payload = await response.json();
  return { authenticated: payload?.authenticated === true, admin: payload?.admin === true, user: payload?.user };
}

export const authLoginUrl = `${ENKH_API_URL}/auth/login?returnTo=${encodeURIComponent('/auth/account-complete')}`;
export const authLogoutUrl = `${ENKH_API_URL}/auth/logout?returnTo=${encodeURIComponent('https://enkhsystems.com')}`;

export async function getCloudWorkspace(): Promise<{ revision: number; workspace: unknown | null }> {
  const response = await fetch(`${ENKH_API_URL}/api/workspace`, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new AdminApiError(response.status);
  const payload = await response.json();
  return { revision: Number(payload.revision || 0), workspace: payload.workspace ?? null };
}

export async function importCloudWorkspace(workspace: unknown) {
  return writeCloudWorkspace('/api/workspace/import', 'POST', { workspace });
}

export async function syncCloudWorkspace(workspace: unknown, expectedRevision: number) {
  return writeCloudWorkspace('/api/workspace', 'PUT', { workspace, expectedRevision });
}

async function writeCloudWorkspace(path: string, method: 'POST' | 'PUT', body: unknown): Promise<{ revision: number; workspace: unknown }> {
  const response = await fetch(`${ENKH_API_URL}${path}`, { method, credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new AdminApiError(response.status);
  const payload = await response.json();
  return { revision: Number(payload.revision), workspace: payload.workspace };
}

export async function getSystemHealth(): Promise<{ healthy: boolean }> {
  const response = await fetch(`${ENKH_API_URL}/health`, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Health API error: ${response.status}`);
  const payload = await response.json();
  return { healthy: payload?.status === 'healthy' || payload?.success === true };
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const response = await fetch(`${ENKH_API_URL}/api/admin/data`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new AdminApiError(response.status);
  const payload = await response.json();
  if (!payload?.success || !payload.data) throw new AdminApiError(502);
  return payload.data;
}

export const adminLoginUrl = `${ENKH_API_URL}/auth/login?returnTo=${encodeURIComponent('/auth/complete')}`;

async function pageAdminRequest(path: string, options: RequestInit): Promise<{ postId: string }> {
  const response = await fetch(`${ENKH_API_URL}/api/admin/page${path}`, {
    ...options,
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new AdminApiError(response.status);
  const payload = await response.json();
  if (!payload?.success || typeof payload.postId !== 'string') throw new AdminApiError(502);
  return { postId: payload.postId };
}

export function createPagePost(message: string) {
  return pageAdminRequest('/posts', { method: 'POST', body: JSON.stringify({ message }) });
}
export function editPagePost(postId: string, message: string) {
  return pageAdminRequest(`/posts/${encodeURIComponent(postId)}`, { method: 'PATCH', body: JSON.stringify({ message }) });
}
export function deletePagePost(postId: string) {
  return pageAdminRequest(`/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' });
}

async function requestKnowledge(input: string): Promise<ActionResponse> {
  return runAction('knowledge', input);
}

export async function sendMessage(
  message: string,
  _history: ChatMessage[] = []
) {
  const data = await runAction('knowledge', _history.length ? { message, history: _history } : message);
  const answer = data.data?.result?.answer?.trim();

  return { ...data, answer, message: answer || data.message };
}

export async function searchWeb(query: string): Promise<ActionResponse> {
  return runAction('search', query);
}

export async function runAction(
  actionId: string,
  input: unknown
): Promise<ActionResponse> {
  const response = await fetch(`${ENKH_API_URL}/actions/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId, input }),
  });

  if (!response.ok) {
    throw new ActionApiError(response.status);
  }

  return response.json();
}
