import { ChatApiError, ChatChange, ChatTurnInput, ChatTurnResponse } from './chat-api';

export type LocalMessage = { id: string; clientConversationId: string; clientTurnId: string;
  role: 'user' | 'assistant'; content: string; status: 'pending' | 'sent' | 'failed' };
export type LocalConversation = { id: string; serverId: string | null; deleted: boolean };
export type LocalChatState = { cursor: number; conversations: LocalConversation[]; messages: LocalMessage[];
  pendingTurns: ChatTurnInput[]; pendingDeletes: string[] };
export type ChatPersistence = { load(key: string): Promise<LocalChatState | null>; save(key: string, state: LocalChatState): Promise<void> };
export type ChatTransport = { turn(input: ChatTurnInput): Promise<ChatTurnResponse>;
  changes(cursor: number, limit?: number): Promise<{ changes: ChatChange[]; cursor: number; hasMore: boolean }>;
  conversations(limit?: number, before?: string): Promise<{ conversations: { id: string; clientConversationId: string }[]; nextCursor: string | null }>;
  sync(batch: { conversations: unknown[]; messages: unknown[]; deletions?: unknown[] }): Promise<unknown> };

function empty(): LocalChatState { return { cursor: 0, conversations: [], messages: [], pendingTurns: [], pendingDeletes: [] }; }
function copy(value: LocalChatState): LocalChatState { return JSON.parse(JSON.stringify(value)) as LocalChatState; }

export class MobileChatEngine {
  private key = '';
  private state = empty();
  private busy = false;
  constructor(private readonly persistence: ChatPersistence, private readonly api: ChatTransport,
    private readonly uuid: () => string, private readonly onChange?: (state: LocalChatState) => void) {}
  view() { return copy(this.state); }
  private changed() { this.onChange?.(this.view()); }
  async switchAccount(key: string | null) {
    if (this.busy) throw new Error('CHAT_BUSY');
    this.key = key || '';
    this.state = key ? (await this.persistence.load(key) || empty()) : empty();
    this.changed();
    return this.view();
  }
  private async save() { if (!this.key) throw new Error('MOBILE_SIGN_IN_REQUIRED'); await this.persistence.save(this.key, this.state); }
  async send(clientConversationId: string, message: string) {
    if (!this.key) throw new Error('MOBILE_SIGN_IN_REQUIRED');
    if (this.busy) throw new Error('CHAT_BUSY');
    const content = message.trim();
    if (!content || content.length > 12000) throw new Error('INVALID_CHAT_MESSAGE');
    const input = { clientConversationId, clientTurnId: this.uuid(), clientMessageId: this.uuid(), message: content };
    const next = copy(this.state);
    if (!next.conversations.some((item) => item.id === clientConversationId))
      next.conversations.push({ id: clientConversationId, serverId: null, deleted: false });
    if (next.conversations.find((item) => item.id === clientConversationId)?.deleted) throw new Error('CHAT_DELETED');
    next.messages.push({ id: input.clientMessageId, clientConversationId, clientTurnId: input.clientTurnId,
      role: 'user', content, status: 'pending' });
    next.pendingTurns.push(input);
    await this.persistence.save(this.key, next); // Durable local write precedes every network call.
    this.state = next;
    this.changed();
    await this.retryPending();
    return input.clientTurnId;
  }
  async retryPending() {
    if (!this.key || this.busy) return;
    this.busy = true;
    try {
      for (const input of [...this.state.pendingTurns]) {
        if (this.state.conversations.find((item) => item.id === input.clientConversationId)?.deleted) continue;
        try {
          const response = await this.api.turn(input); // IDs are unchanged on every retry.
          const next = copy(this.state);
          const conversation = next.conversations.find((item) => item.id === input.clientConversationId);
          if (conversation) conversation.serverId = response.conversationId;
          const user = next.messages.find((item) => item.id === input.clientMessageId);
          if (user) user.status = 'sent';
          if (!next.messages.some((item) => item.id === response.assistantClientMessageId))
            next.messages.push({ id: response.assistantClientMessageId, clientConversationId: input.clientConversationId,
              clientTurnId: input.clientTurnId, role: 'assistant', content: response.answer, status: 'sent' });
          next.pendingTurns = next.pendingTurns.filter((item) => item.clientTurnId !== input.clientTurnId);
          await this.persistence.save(this.key, next);
          this.state = next;
          this.changed();
        } catch {
          const next = copy(this.state);
          const user = next.messages.find((item) => item.id === input.clientMessageId);
          if (user) user.status = 'failed';
          await this.persistence.save(this.key, next);
          this.state = next; // Preserve the exact request for safe later retry.
          this.changed();
        }
      }
    } finally { this.busy = false; }
  }
  async remove(clientConversationId: string) {
    if (!this.key) throw new Error('MOBILE_SIGN_IN_REQUIRED');
    const next = copy(this.state);
    const conversation = next.conversations.find((item) => item.id === clientConversationId);
    if (!conversation) return;
    conversation.deleted = true;
    if (!next.pendingDeletes.includes(clientConversationId)) next.pendingDeletes.push(clientConversationId);
    await this.persistence.save(this.key, next);
    this.state = next;
    this.changed();
    await this.retryDeletes();
  }
  async retryDeletes() {
    if (!this.key || this.busy) return;
    this.busy = true;
    try {
      for (const id of [...this.state.pendingDeletes]) {
        if (!this.state.conversations.find((item) => item.id === id)?.serverId) {
          const next = copy(this.state);
          next.pendingDeletes = next.pendingDeletes.filter((item) => item !== id);
          await this.persistence.save(this.key, next);
          this.state = next;
          this.changed();
          continue;
        }
        try {
          await this.api.sync({ conversations: [], messages: [], deletions: [{ clientConversationId: id }] });
          const next = copy(this.state);
          next.pendingDeletes = next.pendingDeletes.filter((item) => item !== id);
          await this.persistence.save(this.key, next);
          this.state = next;
          this.changed();
        } catch { /* Keep tombstone pending; a local-only unsent conversation may not exist remotely yet. */ }
      }
    } finally { this.busy = false; }
  }
  async pull() {
    if (!this.key || this.busy) return;
    this.busy = true;
    try {
      const next = copy(this.state);
      let cursor = next.cursor;
      const changes: ChatChange[] = [];
      for (let page = 0; page < 20; page++) {
        let response;
        try { response = await this.api.changes(cursor, 50); }
        catch (error) {
          if (error instanceof ChatApiError && error.status === 410 && error.code === 'CHAT_SYNC_RESET_REQUIRED') {
            cursor = 0; changes.length = 0; // Never remove pending local commands or their messages.
            continue;
          }
          throw error;
        }
        if (response.cursor < cursor || response.changes.length > 50) throw new Error('CHAT_SYNC_INVALID');
        changes.push(...response.changes);
        cursor = response.cursor;
        if (!response.hasMore) break;
        if (page === 19) throw new Error('CHAT_SYNC_PAGE_LIMIT');
      }
      // The server may order a message before its conversation's latest change-sequence.
      for (const change of changes.filter((item) => item.kind === 'conversation')) {
        if (!change.clientConversationId) continue;
        let local = next.conversations.find((item) => item.id === change.clientConversationId);
        if (!local) { local = { id: change.clientConversationId, serverId: change.id, deleted: false };
          next.conversations.push(local); }
        local.serverId = change.id;
        if (change.deletedAt) local.deleted = true;
      }
      for (const change of changes.filter((item) => item.kind === 'message')) {
        if (!change.clientMessageId || !change.conversationId || !change.role) continue;
        const conversation = next.conversations.find((item) => item.serverId === change.conversationId);
        if (!conversation || conversation.deleted || next.messages.some((item) => item.id === change.clientMessageId)) continue;
        if (change.content !== null)
          next.messages.push({ id: change.clientMessageId, clientConversationId: conversation.id,
            clientTurnId: change.clientTurnId || '', role: change.role, content: change.content, status: 'sent' });
      }
      next.cursor = cursor;
      await this.persistence.save(this.key, next);
      this.state = next;
      this.changed();
    } finally { this.busy = false; }
  }
}
