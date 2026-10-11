import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { controlCopy } from '../admin/control-copy';
import { useI18n } from '../i18n';

export function AdminConfigEditor() {
  const { t, language } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const rows = [t('control.maintenance'),t('control.announcement'),t('control.minimumVersion'),t('control.recommendedVersion'),t('control.forceUpdate'),t('control.featureFlags')];
  return <View style={s.panel}><Pressable accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(value=>!value)} style={s.banner}><Text style={s.bannerText}>{controlCopy[language].disabled}</Text><Text>{controlCopy[language].details} {expanded?'−':'＋'}</Text></Pressable>
    {expanded && rows.map(label=><View key={label} style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{t('control.notAvailable')}</Text></View>)}
    {expanded && <View accessibilityState={{disabled:true}} style={s.disabled}><Text style={s.disabledText}>{t('control.readOnly')}</Text></View>}
  </View>;
}
const s=StyleSheet.create({panel:{borderWidth:1,borderColor:'#DCE8F5',borderRadius:18,backgroundColor:'#FFF',overflow:'hidden'},banner:{padding:14,backgroundColor:'#FFF3E0'},bannerText:{fontSize:13,fontWeight:'900',color:'#9A5B13'},row:{minHeight:52,paddingHorizontal:15,paddingVertical:12,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8,borderTopWidth:1,borderTopColor:'#EDF2F7'},label:{fontSize:13,fontWeight:'800',color:'#334E68'},value:{fontSize:13,color:'#829AB1'},disabled:{margin:14,minHeight:42,alignItems:'center',justifyContent:'center',borderRadius:11,backgroundColor:'#EDF2F7'},disabledText:{fontSize:13,fontWeight:'900',color:'#627D98'}});
