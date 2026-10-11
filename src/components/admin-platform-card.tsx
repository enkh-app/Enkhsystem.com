import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { EvidenceClass } from '../admin/control-types';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n';
import { controlCopy } from '../admin/control-copy';

const evidenceKeys: Record<EvidenceClass, TranslationKey> = {
  configured: 'control.evidenceConfigured', reported: 'control.evidenceReported', observed: 'control.evidenceObserved',
  deployment: 'control.evidenceDeployment', unknown: 'control.evidenceUnknown',
};

export function AdminPlatformCard({ title, detail, evidence = 'unknown', availability, source, checkedAt, children }: { title: string; detail?: string; evidence?: EvidenceClass; availability?: 'unknown'|'known'|'stale'; source?: string; checkedAt?: string; children?: React.ReactNode }) {
  const { t, language } = useI18n();
  const desktop = useWindowDimensions().width >= 1024;
  return <View style={s.card}><View style={[s.top, desktop && s.desktopTop]}><Text style={[s.title, desktop && s.desktopTitle]}>{title}</Text><View style={[s.badge, evidence === 'unknown' && s.badgeMuted]}><Text style={s.badgeText}>{evidence === 'unknown' ? controlCopy[language].unknown : t(evidenceKeys[evidence])}</Text></View></View>
    {availability === 'stale' ? <Text style={s.detail}>{controlCopy[language].stale}</Text> : null}
    {detail ? <Text style={s.detail}>{detail}</Text> : null}{children}
    {(source || checkedAt) && <Text style={s.detail}>{[source, checkedAt].filter(Boolean).join(' · ')}</Text>}</View>;
}

const s = StyleSheet.create({
  card:{flexGrow:1,flexShrink:1,flexBasis:180,minWidth:0,padding:14,borderRadius:14,borderWidth:1,borderColor:'#DCE8F5',backgroundColor:'#FFF'},
  top:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:8}, title:{fontSize:18,fontWeight:'900',color:'#102A43'},
  desktopTop:{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start',flexWrap:'nowrap'},desktopTitle:{minHeight:48,lineHeight:24},
  badge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#EAF2FF'},badgeMuted:{backgroundColor:'#EDF2F7'},badgeText:{fontSize:11,fontWeight:'900',color:'#486581'},
  detail:{marginTop:10,fontSize:13,lineHeight:19,color:'#627D98'},
});
