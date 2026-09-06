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
