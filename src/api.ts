const LOCAL_ENKH_API_URL = 'http://localhost:3000';
const PRODUCTION_ENKH_API_URL = 'https://api.enkhsystems.com';

const configuredApiUrl = process.env.EXPO_PUBLIC_ENKH_API_URL?.trim();

export const ENKH_API_URL = (
  __DEV__
    ? configuredApiUrl || LOCAL_ENKH_API_URL
    : PRODUCTION_ENKH_API_URL
).replace(/\/$/, '');

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type KnowledgeResult = {
  id: string;
  title: string;
  description: string;
  category: string;
};

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: unknown;
};

type KnowledgeActionResponse = ActionResponse & {
  response?: string;
  content?: string;
  data?: {
    result?: {
      answer?: string;
    };
  };
};

async function requestKnowledge(input: string): Promise<KnowledgeActionResponse> {
  const response = await runAction('knowledge', input);

  return response as KnowledgeActionResponse;
}

export async function sendMessage(
  message: string,
  _history: ChatMessage[] = []
) {
  const data = await requestKnowledge(message);
  const answer = data.data?.result?.answer?.trim();

  return {
    ...data,
    answer,
    message: answer || data.message,
  };
}

export async function searchKnowledge(
  query: string
): Promise<KnowledgeResult[]> {
  const data = await requestKnowledge(query);
  const answer = data.data?.result?.answer?.trim();

  if (!answer) {
    return [];
  }

  return [
    {
      id: 'knowledge-answer',
      title: query,
      description: answer,
      category: 'ENKH AI',
    },
  ];
}

export async function runAction(
  actionId: string,
  input: string
): Promise<ActionResponse> {
  const response = await fetch(
    `${ENKH_API_URL}/actions/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionId,
        input,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Action API error: ${response.status}`
    );
  }

  const data = await response.json();

  return data;
}
