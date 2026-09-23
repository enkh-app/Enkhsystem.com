export const nativePrimaryRoutes = [
  { label: 'Нүүр', icon: '⌂', href: '/' },
  { label: 'Чат', icon: '✦', href: '/chat' },
  { label: 'Үйлдэл', icon: '◇', href: '/actions' },
  { label: 'Мэдлэг', icon: '⌕', href: '/knowledge' },
  { label: 'Би', icon: '○', href: '/account' },
] as const;

export function nativePrimaryRoute(pathname: string) {
  if (pathname === '/chat') return '/chat';
  if (pathname === '/actions' || pathname === '/tools' || pathname.startsWith('/action') || pathname.startsWith('/tools/')) return '/actions';
  if (pathname === '/knowledge' || pathname.startsWith('/knowledge-') || pathname === '/search') return '/knowledge';
  if (pathname === '/account' || pathname === '/workspace') return '/account';
  return '/';
}
