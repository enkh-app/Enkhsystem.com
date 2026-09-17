export type ChatTurnInput = { clientConversationId: string; clientTurnId: string; clientMessageId: string; message: string };
export type ChatTurnResponse = { success: true; conversationId: string; userMessageId: string;
  assistantMessageId: string; assistantClientMessageId: string; answer: string; duplicate: boolean; cursor: number };
export type ChatChange = { kind: 'conversation' | 'message'; id: string; changeSeq: number; deletedAt: string | null;
  conversationId: string | null; clientConversationId: string | null; clientMessageId: string | null;
  clientTurnId: string | null; role: 'user' | 'assistant' | null; content: string | null };
export class ChatApiError extends Error { constructor(public status: number, public code: string) { super(code); } }

const PRODUCTION_CHAT_API = 'https://api.enkhsystems.com';
const TEST_CHAT_API = 'https://api-test.enkhsystems.com';

export function resolveMobileChatApiBase(value?: string): string {
  if (value === undefined) return PRODUCTION_CHAT_API;
  if (value === TEST_CHAT_API) return TEST_CHAT_API;
  throw new Error('INVALID_CHAT_API_BASE');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validId(id: string) { if (!UUID.test(id)) throw new ChatApiError(400, 'INVALID_ID'); return id; }
function validateTurn(data: unknown): ChatTurnResponse {
  const value = data as Partial<ChatTurnResponse>;
  if (!value || value.success !== true || !UUID.test(value.conversationId || '') ||
    !UUID.test(value.userMessageId || '') || !UUID.test(value.assistantMessageId || '') ||
    !UUID.test(value.assistantClientMessageId || '') || typeof value.answer !== 'string' ||
    !value.answer.trim() || value.answer.length > 12000 || typeof value.duplicate !== 'boolean' ||
    !Number.isSafeInteger(value.cursor) || value.cursor! < 0) throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
  return value as ChatTurnResponse;
}

export function createMobileChatApi(token: () => Promise<string>, transport: typeof fetch = fetch,
  apiBase = PRODUCTION_CHAT_API, clientType: 'ios' | 'android' = 'ios') {
  if (apiBase !== PRODUCTION_CHAT_API && apiBase !== TEST_CHAT_API) throw new Error('INVALID_CHAT_API_BASE');
  async function request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
    const accessToken = await token();
    if (!accessToken || /[\r\n]/.test(accessToken)) throw new ChatApiError(401, 'MOBILE_SIGN_IN_REQUIRED');
    let response: Response;
    try { response = await transport(`${apiBase}${path}`, { method, redirect: 'error',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`,
        'X-Enkh-Client-Type': clientType, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
    catch { throw new ChatApiError(0, 'NETWORK_UNAVAILABLE'); }
    let data: unknown;
    try { data = await response.json(); } catch { throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE'); }
    if (JSON.stringify(data).length > 1_000_000) throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
    if (!response.ok) {
      const code = (data as { error?: { code?: unknown } })?.error?.code;
      throw new ChatApiError(response.status, typeof code === 'string' ? code : 'CHAT_REQUEST_FAILED');
    }
    return data;
  }
  return {
    turn: async (input: ChatTurnInput) => validateTurn(await request('/api/chat/turns', 'POST', input)),
    conversations: async (limit = 50, before?: string) => {
      const data = await request(`/api/chat/conversations?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`) as
        { conversations?: unknown[]; nextCursor?: unknown };
      if (!Array.isArray(data?.conversations) || data.conversations.length > 100 ||
        data.conversations.some((item) => !item || typeof item !== 'object' ||
          !UUID.test((item as { id?: string }).id || '') ||
          !UUID.test((item as { clientConversationId?: string }).clientConversationId || '')) ||
        (data.nextCursor !== null && typeof data.nextCursor !== 'string')) throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
      return data as { conversations: { id: string; clientConversationId: string }[]; nextCursor: string | null };
    },
    messages: async (id: string, limit = 50, before?: string) => {
      const data = await request(`/api/chat/conversations/${validId(id)}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`) as
        { messages?: unknown[]; nextCursor?: unknown };
      if (!Array.isArray(data?.messages) || data.messages.length > 100 ||
        data.messages.some((item) => !item || typeof item !== 'object' ||
          !UUID.test((item as { id?: string }).id || '') ||
          !['user', 'assistant'].includes((item as { role?: string }).role || '') ||
          ((item as { content?: unknown }).content !== null &&
            (typeof (item as { content?: unknown }).content !== 'string' ||
              ((item as { content: string }).content.length > 12000)))) ||
        (data.nextCursor !== null && typeof data.nextCursor !== 'string')) throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
      return data as { messages: unknown[]; nextCursor: string | null };
    },
    sync: async (batch: { conversations: unknown[]; messages: unknown[]; deletions?: unknown[] }) =>
      request('/api/chat/sync', 'POST', batch),
    changes: async (cursor: number, limit = 50) => {
      const data = await request(`/api/chat/changes?cursor=${cursor}&limit=${limit}`) as
        { changes?: ChatChange[]; cursor?: unknown; hasMore?: unknown };
      if (!Array.isArray(data?.changes) || data.changes.length > 100 ||
        !Number.isSafeInteger(data.cursor) || typeof data.hasMore !== 'boolean' ||
        data.changes.some((change) => !['conversation', 'message'].includes(change?.kind) ||
          !Number.isSafeInteger(change?.changeSeq) || !UUID.test(change?.id || '') ||
          (change?.content !== null && (typeof change?.content !== 'string' || change.content.length > 12000))))
        throw new ChatApiError(502, 'MALFORMED_CHAT_RESPONSE');
      return data as { changes: ChatChange[]; cursor: number; hasMore: boolean };
    },
    remove: async (id: string) => request(`/api/chat/conversations/${validId(id)}`, 'DELETE'),
  };
}
