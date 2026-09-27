import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { mobileAccessToken } from '../../mobile/auth.native';
import { createMobileAdminApi, MobileAdminApiError, MobileAdminOverview } from '../../mobile/admin-api';

const api = createMobileAdminApi(mobileAccessToken);
export default function NativeAdminScreen() {
  const [data, setData] = useState<MobileAdminOverview>(); const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { setData(await api.overview()); }
    catch (e) { setData(undefined); setError(e instanceof MobileAdminApiError && e.status === 403 ? 'Админ эрх шаардлагатай.' : 'Мэдээлэл ачаалсангүй.'); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <SafeAreaView edges={['top']} style={s.page}><AppHeader active="admin"/><ScrollView contentContainerStyle={s.content}>
    <Text accessibilityRole="header" style={s.title}>Админ</Text><Text style={s.subtitle}>Зөвхөн унших системийн төлөв.</Text>
    {!data && !error ? <ActivityIndicator style={s.loading}/> : null}{error ? <Text style={s.error}>{error}</Text> : null}
    {data ? <><View style={s.grid}><Metric label="Database" value={data.database.status}/><Metric label="Workspace accounts" value={data.accounts.withWorkspace}/>
      <Metric label="Workspaces" value={data.workspaces.records}/><Metric label="Reminders" value={data.reminders.total}/></View>
      <Pressable accessibilityRole="link" style={s.button} onPress={() => router.push('/admin/users' as never)}><Text style={s.buttonText}>Хэрэглэгчид</Text></Pressable></> : null}
  </ScrollView></SafeAreaView>;
}
function Metric({label,value}:{label:string;value:string|number}){return <View style={s.metric}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#F5F7FA'},content:{padding:18,paddingBottom:40},title:{fontSize:28,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:5,color:'#627D98'},loading:{marginTop:36},error:{marginTop:24,color:'#9B2C2C'},grid:{marginTop:22,flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',padding:16,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},label:{color:'#627D98',fontSize:12,fontWeight:'700'},value:{marginTop:8,color:'#102A43',fontSize:21,fontWeight:'900'},button:{marginTop:18,minHeight:50,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#1769E0'},buttonText:{color:'#FFF',fontWeight:'900'}});
