import { StyleSheet, Text, View } from 'react-native';
import type { ReleaseRecord } from '../admin/control-types';
import { useI18n } from '../i18n';

export function AdminReleaseHistory({ releases }: { releases?: ReleaseRecord[] }) {
  const { t }=useI18n();
  if (!releases?.length) return <View style={s.empty}><Text style={s.title}>{t('control.releaseUnavailable')}</Text><Text style={s.body}>{t('control.releaseTruth')}</Text></View>;
  return <View style={s.list}>{releases.map(item=><View key={item.id} style={s.row}><Text style={s.title}>{item.platform} · {item.version}</Text><Text style={s.body}>{item.build || '—'} · {item.channel}</Text></View>)}</View>;
}
const s=StyleSheet.create({empty:{padding:20,borderWidth:1,borderColor:'#DCE8F5',borderRadius:18,backgroundColor:'#FFF'},list:{gap:8},row:{padding:15,borderWidth:1,borderColor:'#DCE8F5',borderRadius:14,backgroundColor:'#FFF'},title:{fontSize:14,fontWeight:'900',color:'#334E68'},body:{marginTop:5,fontSize:13,lineHeight:19,color:'#829AB1'}});
