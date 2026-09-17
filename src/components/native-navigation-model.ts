export const nativePrimaryRoutes = [
  { label: 'Home', icon: '⌂', href: '/' },
  { label: 'Chat', icon: '✦', href: '/chat' },
  { label: 'Actions', icon: '◇', href: '/actions' },
  { label: 'Knowledge', icon: '⌕', href: '/knowledge' },
  { label: 'Account', icon: '○', href: '/account' },
] as const;

export function nativePrimaryRoute(pathname: string) {
  if (pathname === '/chat') return '/chat';
  if (pathname === '/actions' || pathname === '/tools' || pathname.startsWith('/action') || pathname.startsWith('/tools/')) return '/actions';
  if (pathname === '/knowledge' || pathname.startsWith('/knowledge-') || pathname === '/search') return '/knowledge';
  if (pathname === '/account' || pathname === '/workspace') return '/account';
  return '/';
}
