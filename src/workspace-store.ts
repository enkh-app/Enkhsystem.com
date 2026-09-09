import type { ChatMessage, SearchSource } from './api';

export const WORKSPACE_STORAGE_KEY = 'enkh.workspace.v1';
export const WORKSPACE_SCHEMA_VERSION = 1;
export const WORKSPACE_BACKUP_KEY = 'enkh.workspace.backup.v1';
export const WORKSPACE_RECOVERY_SNAPSHOT_PREFIX = 'enkh.workspace.pre-restore.v1.';
export const MAX_CONTEXT_MESSAGES = 12;
export const MAX_CONTEXT_CHARS = 12000;

export type SessionType = 'chat' | 'search' | 'action';
export type EntryRole = 'user' | 'assistant' | 'system';
export type EntryType = 'message' | 'search' | 'action';

export type WorkspaceSession = {
  id: string;
  title: string;
  type: SessionType;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceEntry = {
  id: string;
  sessionId: string;
  role: EntryRole;
  type: EntryType;
  content: string;
  createdAt: string;
  sources?: SearchSource[];
  actionId?: string;
  structuredResult?: unknown;
};

export type WorkspaceState = {
  version: typeof WORKSPACE_SCHEMA_VERSION;
  sessions: WorkspaceSession[];
  entries: WorkspaceEntry[];
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LoadResult = { state: WorkspaceState; issue?: 'unavailable' | 'corrupt' };
export type BackupInspection = {
  exists: boolean;
  valid: boolean;
  sessionCount: number;
  schemaVersion?: number;
  timestamp?: string;
  counts: { chat: number; search: number; action: number };
};

export const emptyWorkspace = (): WorkspaceState => ({ version: WORKSPACE_SCHEMA_VERSION, sessions: [], entries: [] });

function storageOrNull(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

function validState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<WorkspaceState>;
  return state.version === WORKSPACE_SCHEMA_VERSION && Array.isArray(state.sessions) && Array.isArray(state.entries);
}

function validRecoveryState(value: unknown): value is WorkspaceState {
  if (!validState(value)) return false;
  return value.sessions.every((session) =>
    session && typeof session.id === 'string' && typeof session.title === 'string' &&
    (session.type === 'chat' || session.type === 'search' || session.type === 'action') &&
    typeof session.createdAt === 'string' && typeof session.updatedAt === 'string'
  ) && value.entries.every((entry) =>
    entry && typeof entry.id === 'string' && typeof entry.sessionId === 'string' &&
    (entry.role === 'user' || entry.role === 'assistant' || entry.role === 'system') &&
    (entry.type === 'message' || entry.type === 'search' || entry.type === 'action') &&
    typeof entry.content === 'string' && typeof entry.createdAt === 'string'
  );
}

export function loadWorkspace(storage?: StorageLike): LoadResult {
  const target = storageOrNull(storage);
  if (!target) return { state: emptyWorkspace(), issue: 'unavailable' };
  try {
    const raw = target.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return { state: emptyWorkspace() };
    const parsed: unknown = JSON.parse(raw);
    return validState(parsed) ? { state: parsed } : { state: emptyWorkspace(), issue: 'corrupt' };
  } catch {
    return { state: emptyWorkspace(), issue: 'corrupt' };
  }
}

export function saveWorkspace(state: WorkspaceState, storage?: StorageLike): boolean {
  const target = storageOrNull(storage);
  if (!target) return false;
  try { target.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function titleFrom(text: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Шинэ session';
  return normalized.length > 52 ? `${normalized.slice(0, 49).trim()}…` : normalized;
}

export function createSession(state: WorkspaceState, type: SessionType, firstText = ''): { state: WorkspaceState; session: WorkspaceSession } {
  const now = new Date().toISOString();
  const session = { id: makeId(), title: titleFrom(firstText), type, createdAt: now, updatedAt: now };
  return { state: { ...state, sessions: [session, ...state.sessions] }, session };
}

export function addEntry(state: WorkspaceState, entry: Omit<WorkspaceEntry, 'id' | 'createdAt'> & Partial<Pick<WorkspaceEntry, 'id' | 'createdAt'>>): WorkspaceState {
  const id = entry.id || makeId();
  if (state.entries.some((item) => item.id === id)) return state;
  const createdAt = entry.createdAt || new Date().toISOString();
  const nextEntry = { ...entry, id, createdAt } as WorkspaceEntry;
  const sessions = state.sessions.map((session) => session.id === entry.sessionId ? { ...session, updatedAt: createdAt } : session);
  return { ...state, sessions, entries: [...state.entries, nextEntry] };
}

export function deleteSession(state: WorkspaceState, sessionId: string): WorkspaceState {
  return { ...state, sessions: state.sessions.filter((item) => item.id !== sessionId), entries: state.entries.filter((item) => item.sessionId !== sessionId) };
}

export function entriesFor(state: WorkspaceState, sessionId: string): WorkspaceEntry[] {
  return state.entries.filter((item) => item.sessionId === sessionId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function contextFor(entries: WorkspaceEntry[]): ChatMessage[] {
  const selected: ChatMessage[] = [];
  let chars = 0;
  for (const entry of [...entries].reverse()) {
    if (entry.type !== 'message' || (entry.role !== 'user' && entry.role !== 'assistant')) continue;
    const content = entry.content.slice(0, 2000);
    if (chars + content.length > MAX_CONTEXT_CHARS) break;
    selected.unshift({ role: entry.role, content });
    chars += content.length;
    if (selected.length >= MAX_CONTEXT_MESSAGES) break;
  }
  return selected;
}

export function clearWorkspace(storage?: StorageLike): boolean {
  const target = storageOrNull(storage);
  if (!target) return false;
  try { target.removeItem(WORKSPACE_STORAGE_KEY); return true; } catch { return false; }
}

export function replaceWorkspaceSafely(next: WorkspaceState, storage?: StorageLike): boolean {
  if (!validState(next)) return false;
  const target = storageOrNull(storage);
  if (!target) return false;
  try {
    const current = target.getItem(WORKSPACE_STORAGE_KEY);
    if (current) target.setItem(WORKSPACE_BACKUP_KEY, current);
    target.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}

export function inspectWorkspaceBackup(storage?: StorageLike): BackupInspection {
  const empty = { exists: false, valid: false, sessionCount: 0, counts: { chat: 0, search: 0, action: 0 } };
  const target = storageOrNull(storage);
  if (!target) return empty;
  try {
    const raw = target.getItem(WORKSPACE_BACKUP_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (!validRecoveryState(parsed)) return { ...empty, exists: true };
    const counts = { chat: 0, search: 0, action: 0 };
    let timestamp = '';
    for (const session of parsed.sessions) {
      counts[session.type] += 1;
      if (session.updatedAt > timestamp) timestamp = session.updatedAt;
    }
    return { exists: true, valid: true, sessionCount: parsed.sessions.length, schemaVersion: parsed.version, timestamp: timestamp || undefined, counts };
  } catch { return { ...empty, exists: true }; }
}

export function restoreWorkspaceBackup(storage?: StorageLike, now = new Date()): { state: WorkspaceState; snapshotKey: string } | null {
  const target = storageOrNull(storage);
  if (!target) return null;
  try {
    const backupRaw = target.getItem(WORKSPACE_BACKUP_KEY);
    if (!backupRaw) return null;
    const backup: unknown = JSON.parse(backupRaw);
    if (!validRecoveryState(backup)) return null;
    const activeRaw = target.getItem(WORKSPACE_STORAGE_KEY);
    const active: unknown = activeRaw ? JSON.parse(activeRaw) : emptyWorkspace();
    if (!validRecoveryState(active)) return null;
    const snapshotKey = `${WORKSPACE_RECOVERY_SNAPSHOT_PREFIX}${now.toISOString()}`;
    target.setItem(snapshotKey, JSON.stringify({ createdAt: now.toISOString(), workspace: active }));
    target.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(backup));
    return { state: backup, snapshotKey };
  } catch { return null; }
}
