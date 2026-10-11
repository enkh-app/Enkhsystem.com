import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminApiError, type AdminInterests, getAdminInterests } from '../../api';
import { AppHeader } from '../../components/app-header';
import { SeoHead } from '../../components/seo-head';
import { useI18n } from '../../i18n';

export default function AdminInterestsScreen() {
  const { t }=useI18n(); const [data,setData]=useState<AdminInterests>(); const [state,setState]=useState<'loading'|'forbidden'|'error'>('loading');
  const load=useCallback(async()=>{setState('loading');try{setData(await getAdminInterests());}catch(error){setData(undefined);setState(error instanceof AdminApiError&&(error.status===401||error.status===403)?'forbidden':'error');}},[]);
  useEffect(()=>{void load();},[load]);
  const trend=data?.questions.trend==='up'?t('interests.up'):data?.questions.trend==='down'?t('interests.down'):t('interests.flat');
  return <SafeAreaView style={s.page}><SeoHead title={t('interests.title')} description={t('interests.subtitle')} path="/admin/interests" noIndex/><AppHeader active="admin"/><ScrollView contentContainerStyle={s.content}>
    <View style={s.heading}><View style={s.copy}><Text accessibilityRole="header" style={s.title}>{t('interests.title')}</Text><Text style={s.subtitle}>{t('interests.subtitle')}</Text></View><Pressable onPress={()=>router.push('/admin' as never)} style={s.back}><Text style={s.backText}>{t('common.back')}</Text></Pressable></View>
    {state==='loading'&&!data&&<View style={s.state}><ActivityIndicator/><Text>{t('common.loading')}</Text></View>}
    {state==='forbidden'&&<View style={s.state}><Text style={s.stateTitle}>{t('admin.forbidden')}</Text><Text>{t('admin.forbiddenHelp')}</Text></View>}
    {state==='error'&&<View style={s.state}><Text style={s.stateTitle}>{t('admin.unavailable')}</Text><Pressable onPress={()=>void load()}><Text style={s.link}>{t('common.retry')}</Text></Pressable></View>}
    {data&&<><View style={s.metrics}><Metric label={t('interests.questions7')} value={data.questions.days7}/><Metric label={t('interests.questions30')} value={data.questions.days30}/><Metric label={t('interests.trend')} value={trend}/></View>
      <Text style={s.section}>{t('interests.topics')}</Text>{data.topics.length?<View style={s.list}>{data.topics.map(item=><View key={item.label} style={s.row}><Text style={s.rowLabel}>{item.label === 'text' ? t('interests.actionText') : item.label}</Text><Text style={s.rowCount}>{item.count}</Text></View>)}</View>:<View style={s.empty}><Text style={s.stateTitle}>{t('interests.empty')}</Text><Text style={s.subtitle}>{t('interests.emptyHelp')}</Text></View>}
      <Text style={s.privacy}>{t('interests.privacy')}</Text></>}
  </ScrollView></SafeAreaView>;
}
function Metric({label,value}:{label:string;value:string|number}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:1080,alignSelf:'center',padding:20,paddingBottom:60},heading:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12},copy:{flexGrow:1,flexShrink:1,flexBasis:240,minWidth:0},title:{fontSize:30,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:6,fontSize:14,lineHeight:20,color:'#627D98'},back:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderRadius:11,backgroundColor:'#EAF2FF'},backText:{fontWeight:'800',color:'#0B57D0'},metrics:{marginTop:22,flexDirection:'row',flexWrap:'wrap',gap:10},metric:{flexGrow:1,flexShrink:1,flexBasis:180,minWidth:0,padding:14,borderRadius:15,backgroundColor:'#FFF'},metricLabel:{fontSize:12,fontWeight:'800',color:'#627D98'},metricValue:{marginTop:7,fontSize:23,fontWeight:'900',color:'#102A43'},section:{marginTop:26,marginBottom:10,fontSize:19,fontWeight:'900',color:'#102A43'},list:{gap:8},row:{flexDirection:'row',justifyContent:'space-between',padding:13,borderRadius:12,backgroundColor:'#FFF'},rowLabel:{flexShrink:1,color:'#334E68',fontWeight:'700'},rowCount:{color:'#102A43',fontWeight:'900'},empty:{padding:18,borderRadius:15,backgroundColor:'#FFF'},state:{minHeight:220,alignItems:'center',justifyContent:'center',gap:10},stateTitle:{fontSize:17,fontWeight:'900',color:'#102A43'},link:{color:'#0B57D0',fontWeight:'900'},privacy:{marginTop:18,fontSize:12,lineHeight:18,color:'#829AB1'}});
