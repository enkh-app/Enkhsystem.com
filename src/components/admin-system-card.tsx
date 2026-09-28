import { StyleSheet, Text, View } from 'react-native';
import type { EvidenceClass } from '../admin/control-types';
import { AdminPlatformCard } from './admin-platform-card';

export function AdminSystemCard({ title, description, evidence = 'unknown' }: { title: string; description: string; evidence?: EvidenceClass }) {
  return <AdminPlatformCard title={title} detail={description} evidence={evidence}><View style={s.rule}/><Text style={s.note}>—</Text></AdminPlatformCard>;
}
const s=StyleSheet.create({rule:{marginTop:14,height:1,backgroundColor:'#EDF2F7'},note:{marginTop:8,color:'#9FB3C8'}});
