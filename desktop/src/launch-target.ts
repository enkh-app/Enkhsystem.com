export type DesktopLaunchTarget = 'local-renderer' | 'remote-poc';

export function selectDesktopLaunchTarget(remotePocValue: string | undefined): DesktopLaunchTarget {
  return remotePocValue === '1' ? 'remote-poc' : 'local-renderer';
}

export const DEVELOPMENT_USER_DATA_DIRECTORY = 'ENKH AI Development';
