import * as SQLite from 'expo-sqlite';
import type { ChatPersistence, LocalChatState } from './chat-engine';

let database: Promise<SQLite.SQLiteDatabase> | null = null;
async function db() {
  if (!database) database = (async () => {
    const value = await SQLite.openDatabaseAsync('enkh-mobile-chat-v1.db');
    await value.execAsync(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS chat_account_state (
        account_key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );`);
    return value;
  })();
  return database;
}
function validKey(key: string) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('INVALID_LOCAL_ACCOUNT');
}
export const nativeChatPersistence: ChatPersistence = {
  async load(key) {
    validKey(key);
    const row = await (await db()).getFirstAsync<{ payload: string }>(
      'SELECT payload FROM chat_account_state WHERE account_key=?', key);
    if (!row) return null;
    if (row.payload.length > 4_000_000) throw new Error('LOCAL_CHAT_INVALID');
    const state = JSON.parse(row.payload) as LocalChatState;
    if (!state || !Array.isArray(state.messages) || !Array.isArray(state.conversations) ||
      !Array.isArray(state.pendingTurns) || !Array.isArray(state.pendingDeletes) ||
      !Number.isSafeInteger(state.cursor)) throw new Error('LOCAL_CHAT_INVALID');
    return state;
  },
  async save(key, state) {
    validKey(key);
    const payload = JSON.stringify(state);
    if (payload.length > 4_000_000) throw new Error('LOCAL_CHAT_FULL');
    await (await db()).runAsync(`INSERT INTO chat_account_state (account_key,payload,updated_at)
      VALUES (?,?,?) ON CONFLICT(account_key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at`,
      key, payload, Date.now());
  },
};
