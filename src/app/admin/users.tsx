import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminApiError, AdminUserSummary, getAdminUsers } from '../../api';
import { AppHeader } from '../../components/app-header';
import { SeoHead } from '../../components/seo-head';
import { useI18n } from '../../i18n';

export default function AdminUsersScreen(){
 const{t}=useI18n();const[users,setUsers]=useState<AdminUserSummary[]>();const[status,setStatus]=useState<'loading'|'auth'|'forbidden'|'error'>('loading');
 const load=useCallback(async()=>{setStatus('loading');try{setUsers(await getAdminUsers())}catch(error){setUsers(undefined);setStatus(error instanceof AdminApiError&&error.status===401?'auth':error instanceof AdminApiError&&error.status===403?'forbidden':'error')}},[]);
 useEffect(()=>{void load()},[load]);
 return <SafeAreaView style={s.page}><SeoHead title="ENKH Admin Users" description="ENKH хэрэглэгчдийн хамгаалагдсан жагсаалт." path="/admin/users" noIndex/><AppHeader active="admin"/><ScrollView contentContainerStyle={s.content}><View style={s.heading}><View><Text accessibilityRole="header" style={s.title}>{t('admin.users')}</Text><Text style={s.subtitle}>{t('admin.usersHelp')}</Text></View>{users&&<Pressable accessibilityRole="button" onPress={()=>void load()} style={s.button}><Text style={s.buttonText}>{t('common.retry')}</Text></Pressable>}</View>
 {status==='loading'&&!users&&<View style={s.state}><ActivityIndicator/><Text>{t('common.loading')}</Text></View>}
 {status==='auth'&&<State text={t('admin.signIn')}/>} {status==='forbidden'&&<State text={t('admin.forbidden')}/>} {status==='error'&&<State text={t('admin.unavailable')}/>} 
 {users&&<View style={s.list}>{users.length===0?<State text={t('admin.usersEmpty')}/>:users.map((user,index)=><View key={`${user.createdAt}-${index}`} style={s.card}><Text style={s.name}>{user.displayName||t('account.user')}</Text><Text style={s.meta}>{user.email||t('admin.emailUnavailable')}</Text><View style={s.row}><Text style={s.label}>{t('admin.userStatus')}: <Text style={s.value}>{user.status==='active'?t('admin.active'):t('admin.suspended')}</Text></Text><Text style={s.label}>{t('admin.created')}: <Text style={s.value}>{new Date(user.createdAt).toLocaleDateString()}</Text></Text></View>{user.lastActivityAt&&<Text style={s.label}>{t('admin.lastActivity')}: <Text style={s.value}>{new Date(user.lastActivityAt).toLocaleDateString()}</Text></Text>}</View>)}</View>}
 </ScrollView></SafeAreaView>;
}
function State({text}:{text:string}){return <View style={s.state}><Text style={s.stateText}>{text}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:1100,alignSelf:'center',paddingHorizontal:20,paddingVertical:32,paddingBottom:60},heading:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12},title:{fontSize:34,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:7,fontSize:15,lineHeight:22,color:'#627D98'},button:{minHeight:44,justifyContent:'center',paddingHorizontal:15,borderRadius:12,backgroundColor:'#EAF2FF'},buttonText:{fontWeight:'800',color:'#0B57D0'},list:{marginTop:22,gap:12},card:{padding:18,borderRadius:18,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},name:{fontSize:18,fontWeight:'900',color:'#102A43'},meta:{marginTop:5,fontSize:14,color:'#486581'},row:{marginTop:14,flexDirection:'row',flexWrap:'wrap',gap:18},label:{fontSize:13,color:'#627D98'},value:{fontWeight:'800',color:'#243B53'},state:{minHeight:180,marginTop:22,alignItems:'center',justifyContent:'center',padding:20,borderRadius:18,backgroundColor:'#FFF'},stateText:{fontWeight:'800',color:'#486581'}});
