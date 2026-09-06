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

async function requestKnowledge(input: string): Promise<ActionResponse> {
  return runAction('knowledge', input);
}

export async function sendMessage(
  message: string,
  _history: ChatMessage[] = []
) {
  const data = await runAction('knowledge', history.length ? { message, history } : message);
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
    throw new Error(`Action API error: ${response.status}`);
  }

  return response.json();
}
