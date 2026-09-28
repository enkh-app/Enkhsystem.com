export type EvidenceClass = 'configured' | 'reported' | 'observed' | 'deployment' | 'unknown';
export type ControlPlatform = 'web' | 'desktop' | 'ios' | 'android' | 'backend';

export type PlatformSummary = {
  platform: ControlPlatform;
  environment?: string;
  version?: string;
  build?: string;
  releaseId?: string;
  updatedAt?: string;
  evidence: EvidenceClass;
};

export type RemoteConfigDraft = {
  platform: ControlPlatform;
  environment: string;
  maintenanceMode: boolean;
  announcement: string | null;
  minimumVersion: string | null;
  recommendedVersion: string | null;
  forceUpdate: boolean;
  featureFlags: Readonly<Record<string, boolean>>;
};

export type ReleaseRecord = {
  id: string;
  platform: ControlPlatform;
  version: string;
  build: string | null;
  channel: string;
  releasedAt: string;
  evidence: 'deployment';
};

export type ControlSnapshot = {
  platforms: PlatformSummary[];
  activeConfig: RemoteConfigDraft | null;
  releases: ReleaseRecord[];
};
