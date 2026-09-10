import { AdminApiError, getAuthState, getCloudWorkspace, syncCloudWorkspace } from './api';
import { loadWorkspace, WorkspaceState } from './workspace-store';

export type WorkspaceSyncPhase = 'local' | 'syncing' | 'synced' | 'pending' | 'conflict';
export type WorkspaceSyncSnapshot = { phase: WorkspaceSyncPhase; revision: number };
type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };
type Dependencies = {
  getAuthState: typeof getAuthState;
  getCloudWorkspace: typeof getCloudWorkspace;
  syncCloudWorkspace: typeof syncCloudWorkspace;
  storage: () => StorageLike | null;
  fingerprint: (email: string) => Promise<string>;
  setTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
  debounceMs: number;
};

const META_KEY = 'enkh.workspace.sync.v1';
const MAX_TRANSIENT_RETRIES = 4;
const sameWorkspace = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const browserStorage = () => { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } };
const fingerprint = async (email: string) => {
  if (!globalThis.crypto?.subtle) throw new Error('Secure fingerprint unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export function createWorkspaceSyncCoordinator(overrides: Partial<Dependencies> = {}) {
  const deps: Dependencies = { getAuthState, getCloudWorkspace, syncCloudWorkspace, storage: browserStorage, fingerprint, setTimer: (callback, delay) => setTimeout(callback, delay), clearTimer: (pendingTimer) => clearTimeout(pendingTimer), debounceMs: 700, ...overrides };
  let snapshot: WorkspaceSyncSnapshot = { phase: 'local', revision: 0 };
  let initialized = false;
  let initializing: Promise<void> | null = null;
  let ownerKey = '';
  let enabled = false;
  let latest: WorkspaceState | null = null;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempts = 0;
  let inFlight = false;
  const listeners = new Set<() => void>();

  const publish = (phase: WorkspaceSyncPhase, revision = snapshot.revision) => { snapshot = { phase, revision }; listeners.forEach((listener) => listener()); };
  const readMeta = () => { try { const raw = deps.storage()?.getItem(META_KEY); return raw ? JSON.parse(raw) as { ownerKey?: string; revision?: number } : {}; } catch { return {}; } };
  const writeMeta = () => { try { deps.storage()?.setItem(META_KEY, JSON.stringify({ ownerKey, revision: snapshot.revision })); } catch {} };
  const currentAccountKey = async () => {
    const auth = await deps.getAuthState();
    if (!auth.authenticated) return '';
    if (auth.user?.accountId) return `account:${auth.user.accountId}`;
    if (auth.user?.email) return deps.fingerprint(auth.user.email);
    return '';
  };

  const scheduleBootstrapRetry = (local: WorkspaceState) => {
    if (retryTimer || retryAttempts >= MAX_TRANSIENT_RETRIES) return;
    const delay = Math.min(30000, 2000 * (2 ** retryAttempts));
    retryAttempts += 1;
    retryTimer = deps.setTimer(() => {
      retryTimer = null;
      initialized = false;
      void initialize(local);
    }, delay);
  };

  const initialize = async (local = loadWorkspace().state) => {
    if (initialized) return;
    if (initializing) return initializing;
    initializing = (async () => {
      try {
        const key = await currentAccountKey();
        if (!key) { publish('pending'); scheduleBootstrapRetry(local); return; }
        const remote = await deps.getCloudWorkspace();
        const meta = readMeta();
        ownerKey = key;
        if (!remote.workspace) { enabled = false; publish('local', 0); return; }
        if (meta.ownerKey && meta.ownerKey !== key) { enabled = false; publish('conflict', remote.revision); return; }
        if (!meta.ownerKey && !sameWorkspace(local, remote.workspace)) { enabled = false; publish('conflict', remote.revision); return; }
        if (meta.ownerKey === key && Number(meta.revision) !== remote.revision) { enabled = false; publish('conflict', remote.revision); return; }
        enabled = true;
        publish(sameWorkspace(local, remote.workspace) ? 'synced' : 'pending', remote.revision);
        writeMeta();
        if (!sameWorkspace(local, remote.workspace)) schedule(local);
      } catch { publish('pending'); scheduleBootstrapRetry(local); }
      finally { initialized = true; initializing = null; }
    })();
    return initializing;
  };

  const scheduleTransientRetry = () => {
    if (retryTimer || !latest || !enabled || retryAttempts >= MAX_TRANSIENT_RETRIES) return;
    const delay = Math.min(30000, 2000 * (2 ** retryAttempts));
    retryAttempts += 1;
    retryTimer = deps.setTimer(() => { retryTimer = null; void drain(); }, delay);
  };

  const drain = async () => {
    if (inFlight || !latest || !enabled) return;
    inFlight = true;
    const state = latest;
    const startedGeneration = generation;
    publish('syncing');
    try {
      const key = await currentAccountKey();
      if (!key) { publish('pending'); scheduleTransientRetry(); return; }
      if (key !== ownerKey) { enabled = false; publish('conflict'); return; }
      const result = await deps.syncCloudWorkspace(state, snapshot.revision);
      retryAttempts = 0;
      publish('synced', result.revision);
      writeMeta();
      if (generation === startedGeneration) latest = null;
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 409) { enabled = false; publish('conflict'); }
      else {
        publish('pending');
        if (!(error instanceof AdminApiError) || error.status >= 500) scheduleTransientRetry();
      }
    } finally {
      inFlight = false;
      if (latest && generation !== startedGeneration && enabled) schedule(latest);
    }
  };

  const schedule = (state: WorkspaceState) => {
    latest = state; generation += 1; publish('pending');
    if (retryTimer) { deps.clearTimer(retryTimer); retryTimer = null; }
    void initialize(state).then(() => {
      if (!enabled) return;
      if (timer) deps.clearTimer(timer);
      timer = deps.setTimer(() => { timer = null; void drain(); }, deps.debounceMs);
    });
  };

  const bind = async (revision: number, workspace: WorkspaceState) => {
    const key = ownerKey || await currentAccountKey();
    if (!key) return;
    ownerKey = key; enabled = true; initialized = true; latest = null;
    publish('synced', revision); writeMeta();
  };
  const retry = () => { if (latest && enabled) schedule(latest); };
  const markLocalDivergent = () => {
    if (timer) { deps.clearTimer(timer); timer = null; }
    if (retryTimer) { deps.clearTimer(retryTimer); retryTimer = null; }
    generation += 1; latest = null; enabled = false; initialized = true;
    publish('pending');
  };
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
  return { initialize, schedule, bind, retry, markLocalDivergent, subscribe, getSnapshot: () => snapshot };
}

export const backgroundWorkspaceSync = createWorkspaceSyncCoordinator();

export const workspaceSyncLabel = (phase: WorkspaceSyncPhase) => ({
  local: 'Local-д хадгалагдсан', syncing: 'Sync хийж байна…', synced: 'Cloud-д хадгалагдсан ✓', pending: 'Sync хүлээгдэж байна', conflict: 'Өөр төхөөрөмж дээр өөрчлөлт байна',
}[phase]);
