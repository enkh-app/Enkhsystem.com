export type DesktopAuthState = {
  status: 'signed-out' | 'signed-in';
  displayName: string | null;
};

export interface DesktopAuthAdapter {
  current(): Promise<DesktopAuthState>;
  signIn(): Promise<DesktopAuthState>;
  signOut(): Promise<DesktopAuthState>;
}

export type DesktopMessage = { id: string; role: 'user' | 'assistant'; content: string; pending?: boolean };

export interface DesktopChatAdapter {
  list(): Promise<DesktopMessage[]>;
  send(content: string): Promise<DesktopMessage[]>;
}

const signedOut: DesktopAuthState = { status: 'signed-out', displayName: null };

export function createPhaseOneAuthAdapter(): DesktopAuthAdapter {
  let state = signedOut;
  return {
    async current() { return state; },
    async signIn() { state = { status: 'signed-in', displayName: 'Nasa' }; return state; },
    async signOut() { state = signedOut; return state; },
  };
}

export function createPhaseOneChatAdapter(): DesktopChatAdapter {
  let messages: DesktopMessage[] = [];
  return {
    async list() { return messages; },
    async send(content) {
      const now = Date.now().toString(36);
      messages = [
        ...messages,
        { id: `user-${now}`, role: 'user', content },
        { id: `enkh-${now}`, role: 'assistant', content: 'Энэ бол Desktop Phase 1 local preview. Auth adapter холбогдсоны дараа Энхийн бодит хариу энд харагдана.' },
      ];
      return messages;
    },
  };
}
