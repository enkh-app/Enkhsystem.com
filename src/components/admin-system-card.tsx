import type { EvidenceClass } from '../admin/control-types';
import { AdminPlatformCard } from './admin-platform-card';

export function AdminSystemCard({ title, description, evidence = 'unknown' }: { title: string; description: string; evidence?: EvidenceClass }) {
  return <AdminPlatformCard title={title} detail={description} evidence={evidence}/>;
}
