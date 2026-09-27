import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { mobileAccessToken } from '../../mobile/auth.native';
import { createMobileAdminApi, MobileAdminUser } from '../../mobile/admin-api';
const api=createMobileAdminApi(mobileAccessToken);
export default function NativeAdminUsers(){const[users,setUsers]=useState<MobileAdminUser[]>();const[error,setError]=useState(false);
 const load=useCallback(async()=>{setError(false);try{setUsers(await api.users())}catch{setUsers(undefined);setError(true)}},[]);
 useFocusEffect(useCallback(()=>{void load()},[load]));return <SafeAreaView edges={['top']} style={s.page}><AppHeader active="admin"/><ScrollView contentContainerStyle={s.content}><Text accessibilityRole="header" style={s.title}>Хэрэглэгчид</Text><Text style={s.subtitle}>Контентгүй, зөвхөн админд харагдах лавлах.</Text>{!users&&!error?<ActivityIndicator style={s.loading}/>:null}{error?<Text style={s.error}>Жагсаалт ачаалсангүй.</Text>:null}{users?.map(user=><Pressable key={user.id} accessibilityRole="link" onPress={()=>router.push(`/admin/users/${user.id}` as never)} style={s.card}><Text style={s.name}>{user.displayName||'ENKH хэрэглэгч'}</Text><Text style={s.meta}>{user.email||'Email мэдээлэлгүй'}</Text><Text style={s.meta}>{user.status}</Text></Pressable>)}</ScrollView></SafeAreaView>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F7FA'},content:{padding:18,paddingBottom:40},title:{fontSize:28,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:5,color:'#627D98'},loading:{marginTop:30},error:{marginTop:24,color:'#9B2C2C'},card:{marginTop:12,padding:17,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},name:{fontSize:16,fontWeight:'900',color:'#102A43'},meta:{marginTop:5,color:'#627D98',fontSize:13}});
