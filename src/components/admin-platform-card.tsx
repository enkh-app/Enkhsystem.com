import { StyleSheet, Text, View } from 'react-native';
import type { EvidenceClass } from '../admin/control-types';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n';

const evidenceKeys: Record<EvidenceClass, TranslationKey> = {
  configured: 'control.evidenceConfigured', reported: 'control.evidenceReported', observed: 'control.evidenceObserved',
  deployment: 'control.evidenceDeployment', unknown: 'control.evidenceUnknown',
};

export function AdminPlatformCard({ title, detail, evidence = 'unknown', children }: { title: string; detail?: string; evidence?: EvidenceClass; children?: React.ReactNode }) {
  const { t } = useI18n();
  return <View style={s.card}><View style={s.top}><Text style={s.title}>{title}</Text><View style={[s.badge, evidence === 'unknown' && s.badgeMuted]}><Text style={s.badgeText}>{t(evidenceKeys[evidence])}</Text></View></View>
    <Text style={s.detail}>{detail || t('control.notAvailable')}</Text>{children}</View>;
}

const s = StyleSheet.create({
  card:{flexGrow:1,flexBasis:220,minWidth:0,minHeight:148,padding:16,borderRadius:18,borderWidth:1,borderColor:'#DCE8F5',backgroundColor:'#FFF'},
  top:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:8}, title:{fontSize:18,fontWeight:'900',color:'#102A43'},
  badge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#EAF2FF'},badgeMuted:{backgroundColor:'#EDF2F7'},badgeText:{fontSize:11,fontWeight:'900',color:'#486581'},
  detail:{marginTop:20,fontSize:13,lineHeight:19,color:'#627D98'},
});
