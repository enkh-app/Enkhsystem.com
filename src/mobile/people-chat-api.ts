const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type PeopleThread = { id: string; peerId: string; peerName: string; updatedAt: string };
export type PeopleMessage = { id: string; senderId: string; content: string; createdAt: string };

export function createPeopleChatApi(token: () => Promise<string>, transport: typeof fetch,
  apiBase: string) {
  if (!['https://api.enkhsystems.com', 'https://api-test.enkhsystems.com'].includes(apiBase))
    throw new Error('INVALID_CHAT_API_BASE');
  async function request(path: string, method = 'GET', body?: unknown) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const bearer = await token();
      if (!bearer || /[\r\n]/.test(bearer)) throw new Error('MOBILE_SIGN_IN_REQUIRED');
      const response = await transport(`${apiBase}/api/people-chat${path}`, {
        method, redirect: 'error', signal: controller.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${bearer}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'MOBILE_SIGN_IN_REQUIRED' : 'PEOPLE_CHAT_UNAVAILABLE');
      return await response.json() as Record<string, unknown>;
    } finally { clearTimeout(timer); }
  }
  function id(value: string) { if (!UUID.test(value)) throw new Error('INVALID_PEOPLE_CHAT_ID'); return value; }
  return {
    me: async () => {
      const data = await request('/me');
      return id(data.accountId as string);
    },
    threads: async () => {
      const data = await request('/threads');
      if (!Array.isArray(data.threads) || data.threads.length > 50 ||
        data.threads.some((row) => !row || !UUID.test(row.id) || !UUID.test(row.peerId) ||
          typeof row.peerName !== 'string')) throw new Error('PEOPLE_CHAT_INVALID_RESPONSE');
      return data.threads as PeopleThread[];
    },
    start: async (recipientId: string) => {
      const data = await request('/threads', 'POST', { recipientId: id(recipientId) });
      return id(data.threadId as string);
    },
    messages: async (threadId: string) => {
      const data = await request(`/threads/${id(threadId)}/messages`);
      if (!Array.isArray(data.messages) || data.messages.length > 50 ||
        data.messages.some((row) => !row || !UUID.test(row.id) || !UUID.test(row.senderId) ||
          typeof row.content !== 'string' || row.content.length > 4000))
        throw new Error('PEOPLE_CHAT_INVALID_RESPONSE');
      return (data.messages as PeopleMessage[]).reverse();
    },
    send: async (threadId: string, clientMessageId: string, content: string) => {
      if (!content.trim() || content.length > 4000) throw new Error('INVALID_PEOPLE_CHAT_MESSAGE');
      await request(`/threads/${id(threadId)}/messages`, 'POST', { clientMessageId: id(clientMessageId), content });
    },
  };
}
