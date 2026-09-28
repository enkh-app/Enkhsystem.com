import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getControlSnapshot, type ControlAvailability } from '../../admin/control-api';
import { AdminApiError, type AdminOverview, adminLoginUrl, getAdminOverview } from '../../api';
import { AdminControlOverview } from '../../components/admin-control-overview';
import { AppHeader } from '../../components/app-header';
import { SeoHead } from '../../components/seo-head';
import { useI18n } from '../../i18n';

type PageState='loading'|'ready'|'auth'|'forbidden'|'error';
export default function AdminControlScreen(){
  const {t}=useI18n(); const [state,setState]=useState<PageState>('loading'); const [control,setControl]=useState<ControlAvailability>(); const [overview,setOverview]=useState<AdminOverview>();
  const load=useCallback(async()=>{setState('loading');try{setOverview(await getAdminOverview());setControl(await getControlSnapshot());setState('ready');}catch(error){setState(error instanceof AdminApiError&&error.status===401?'auth':error instanceof AdminApiError&&error.status===403?'forbidden':'error');}},[]);
  useEffect(()=>{void load();},[load]);
  return <SafeAreaView style={s.page}><SeoHead title="ENKH Control Center" description="ENKH-ийн хамгаалагдсан control center." path="/admin/control" noIndex/><AppHeader active="admin"/>
    <ScrollView contentContainerStyle={s.content}><View style={s.head}><View style={s.copy}><Text accessibilityRole="header" style={s.title}>{t('control.title')}</Text><Text style={s.subtitle}>{t('control.subtitle')}</Text></View><Pressable onPress={()=>router.push('/admin' as never)} style={s.back}><Text style={s.backText}>{t('common.back')}</Text></Pressable></View>
      {state==='loading'&&<View style={s.state}><ActivityIndicator/><Text>{t('common.loading')}</Text></View>}
      {state==='auth'&&<State title={t('admin.signIn')} body={t('admin.signInHelp')} label={t('account.signIn')} action={()=>void Linking.openURL(adminLoginUrl)}/>}
      {state==='forbidden'&&<State title={t('admin.forbidden')} body={t('admin.forbiddenHelp')}/>}
      {state==='error'&&<State title={t('admin.unavailable')} body={t('admin.retryHelp')} label={t('common.retry')} action={()=>void load()}/>}
      {state==='ready'&&<><View style={s.truth}><Text style={s.truthText}>{control?.available?t('control.availableEvidence'):t('control.unavailableEvidence')}</Text></View><AdminControlOverview snapshot={control?.available?control.snapshot:undefined} overview={overview}/></>}
    </ScrollView></SafeAreaView>;
}
function State({title,body,label,action}:{title:string;body:string;label?:string;action?:()=>void}){return <View style={s.state}><Text style={s.stateTitle}>{title}</Text><Text style={s.stateBody}>{body}</Text>{action&&<Pressable onPress={action} style={s.primary}><Text style={s.primaryText}>{label}</Text></Pressable>}</View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:1080,alignSelf:'center',paddingHorizontal:16,paddingVertical:24,paddingBottom:60},head:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12},copy:{flexGrow:1,flexShrink:1,flexBasis:240},title:{fontSize:32,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:6,fontSize:14,lineHeight:21,color:'#627D98'},back:{minHeight:42,justifyContent:'center',paddingHorizontal:14,borderRadius:11,backgroundColor:'#EAF2FF'},backText:{fontWeight:'800',color:'#0B57D0'},truth:{marginTop:20,padding:13,borderRadius:12,backgroundColor:'#EDF2F7'},truthText:{fontSize:13,lineHeight:19,fontWeight:'800',color:'#486581'},state:{minHeight:260,marginTop:22,alignItems:'center',justifyContent:'center',gap:10,padding:22,borderRadius:18,backgroundColor:'#FFF'},stateTitle:{fontSize:20,fontWeight:'900',color:'#102A43'},stateBody:{textAlign:'center',fontSize:14,lineHeight:21,color:'#627D98'},primary:{minHeight:44,justifyContent:'center',paddingHorizontal:18,borderRadius:12,backgroundColor:'#0B57D0'},primaryText:{fontWeight:'900',color:'#FFF'}});
