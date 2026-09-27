import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../../components/app-header';
import { mobileAccessToken } from '../../../mobile/auth.native';
import { createMobileAdminApi, MobileAdminUserDetail } from '../../../mobile/admin-api';
const api=createMobileAdminApi(mobileAccessToken);
export default function NativeAdminUserDetail(){const params=useLocalSearchParams<{userId?:string}>();const userId=typeof params.userId==='string'?params.userId:'';const[data,setData]=useState<MobileAdminUserDetail>();const[error,setError]=useState(false);
 useEffect(()=>{let active=true;void api.user(userId).then(value=>{if(active)setData(value)}).catch(()=>{if(active)setError(true)});return()=>{active=false}},[userId]);
 return <SafeAreaView edges={['top']} style={s.page}><AppHeader active="admin"/><ScrollView contentContainerStyle={s.content}>{!data&&!error?<ActivityIndicator/>:null}{error?<Text style={s.error}>Хэрэглэгчийн мэдээлэл олдсонгүй.</Text>:null}{data?<><Text accessibilityRole="header" style={s.title}>{data.user.displayName||'ENKH хэрэглэгч'}</Text><Text style={s.email}>{data.user.email||'Email мэдээлэлгүй'}</Text><View style={s.card}><Row label="Төлөв" value={data.user.status}/><Row label="Бүртгүүлсэн" value={new Date(data.user.createdAt).toLocaleDateString()}/><Row label="Workspace" value={data.workspace.exists?'Байгаа':'Байхгүй'}/><Row label="Reminder" value={String(data.reminders.total)}/></View></>:null}</ScrollView></SafeAreaView>}
function Row({label,value}:{label:string;value:string}){return <View style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F7FA'},content:{padding:18,paddingBottom:40},title:{fontSize:26,fontWeight:'900',color:'#102A43'},email:{marginTop:6,color:'#627D98'},error:{color:'#9B2C2C'},card:{marginTop:20,padding:18,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},row:{minHeight:45,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#EDF3F9'},label:{color:'#627D98'},value:{color:'#102A43',fontWeight:'800'}});
