import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import iconUrl from '../../assets/enkh.ico';
import { enkhTokens } from '../../../src/presentation/enkh-design-tokens';
import { createPhaseOneAuthAdapter, createPhaseOneChatAdapter, DesktopAuthState, DesktopMessage } from './adapters';
import { desktopPrimaryRoutes, DesktopRoute, isPhaseOneRoute } from './ui-model';

const initialAuth: DesktopAuthState = { status: 'signed-out', displayName: null };
const tokenStyles = {
  background: enkhTokens.color.canvas,
  '--enkh-primary': enkhTokens.color.primary,
  '--enkh-primary-strong': enkhTokens.color.primaryStrong,
  '--enkh-max-width': `${enkhTokens.layout.desktopMaxWidth}px`,
} as CSSProperties;

export function App() {
  const authAdapter = useMemo(createPhaseOneAuthAdapter, []);
  const chatAdapter = useMemo(createPhaseOneChatAdapter, []);
  const [route, setRoute] = useState<DesktopRoute>('home');
  const [auth, setAuth] = useState(initialAuth);
  const [messages, setMessages] = useState<DesktopMessage[]>([]);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { void authAdapter.current().then(setAuth); void chatAdapter.list().then(setMessages); }, [authAdapter, chatAdapter]);

  const navigate = (next: DesktopRoute) => {
    if (!isPhaseOneRoute(next)) { setNotice('Энэ хэсэг Desktop-ийн дараагийн үе шатанд орно.'); return; }
    setNotice(''); setRoute(next);
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput(''); setMessages(await chatAdapter.send(content)); setRoute('chat');
  };

  return <div className="app-shell" style={tokenStyles}>
    <header className="app-header">
      <button className="brand" type="button" onClick={() => navigate('home')} aria-label="ENKH AI нүүр">
        <img src={iconUrl} alt="" className="brand-icon" /><span>ENKH AI</span>
      </button>
      <span className="language" aria-label="Хэл">MN</span>
    </header>

    <main className="viewport">
      {route === 'home' && <section className="screen home-screen">
        <p className="greeting">Сайн байна уу, {auth.displayName ?? 'Nasa'}.</p>
        <h1>Энхтэй ярилцах</h1>
        <form className="home-composer" onSubmit={send}>
          <textarea aria-label="Энхэд бичих зурвас" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Энхээс юм асуух..." />
          <div className="composer-actions"><button type="button" className="secondary" disabled>🎙</button><button type="submit" className="primary" disabled={!input.trim()}>Илгээх ↑</button></div>
        </form>
        <p className="hint">Асуулт, тооцоо, баримт бичиг, ажлын төлөвлөгөөг эндээс эхлүүлнэ.</p>
      </section>}

      {route === 'chat' && <section className="screen chat-screen">
        <div className="screen-title"><div><p className="eyebrow">ENKH AI</p><h1>Чат</h1></div><button className="secondary" onClick={() => setMessages([])}>Шинэ чат</button></div>
        {auth.status === 'signed-out' ? <StateCard title="Chat-аа төхөөрөмж хооронд хадгална уу." body="Desktop authentication adapter Phase 2-т production Auth0-той холбогдоно."><button className="primary" onClick={() => void authAdapter.signIn().then(setAuth)}>Preview нэвтрэх</button></StateCard> : <>
          <div className="messages" aria-live="polite">{messages.length === 0 ? <p className="empty">Энд таны шинэ яриа эхэлнэ.</p> : messages.map((message) => <div key={message.id} className={`bubble ${message.role}`}>{message.content}</div>)}</div>
          <form className="chat-composer" onSubmit={send}><textarea aria-label="Чат зурвас" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Энхээс асуух..."/><button className="primary" disabled={!input.trim()}>Илгээх</button></form>
        </>}
      </section>}

      {route === 'account' && <section className="screen account-screen">
        <h1>Бүртгэл</h1><p className="subtitle">Таны Desktop ENKH тохиргоо.</p>
        <div className="account-card"><div className="avatar">{(auth.displayName ?? 'Э').slice(0, 1)}</div><h2>{auth.status === 'signed-in' ? 'Desktop preview-д нэвтэрсэн' : 'Desktop Chat-д нэвтрээгүй'}</h2><p>Web cookie болон Mobile bearer auth-аас тусгаарласан Desktop adapter boundary.</p>{auth.status === 'signed-in' ? <button className="secondary" onClick={() => void authAdapter.signOut().then(setAuth)}>Гарах</button> : <button className="primary" onClick={() => void authAdapter.signIn().then(setAuth)}>Preview нэвтрэх</button>}</div>
      </section>}
      {notice && <div className="notice" role="status">{notice}</div>}
    </main>

    <nav className="bottom-nav" aria-label="Үндсэн navigation">{desktopPrimaryRoutes.map((item) => <button key={item.id} type="button" className={route === item.id ? 'active' : ''} onClick={() => navigate(item.id)} aria-current={route === item.id ? 'page' : undefined}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
  </div>;
}

function StateCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return <div className="state-card"><h2>{title}</h2><p>{body}</p>{children}</div>;
}
