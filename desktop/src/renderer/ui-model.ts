export const desktopPrimaryRoutes = [
  { id: 'home', label: 'Нүүр', icon: '⌂', enabled: true },
  { id: 'chat', label: 'Чат', icon: '✦', enabled: true },
  { id: 'actions', label: 'Үйлдэл', icon: '◇', enabled: false },
  { id: 'knowledge', label: 'Мэдлэг', icon: '⌕', enabled: false },
  { id: 'account', label: 'Би', icon: '○', enabled: true },
] as const;

export type DesktopRoute = (typeof desktopPrimaryRoutes)[number]['id'];

export function isPhaseOneRoute(route: DesktopRoute) {
  return desktopPrimaryRoutes.find((item) => item.id === route)?.enabled === true;
}
