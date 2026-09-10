import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminApiError, AdminDashboardData, adminLoginUrl, getAdminDashboard } from '../../api';
import { AppHeader } from '../../components/app-header';
import { SeoHead } from '../../components/seo-head';

const number = new Intl.NumberFormat('mn-MN');

function Card({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.card}><Text style={styles.cardLabel}>{label}</Text><Text style={styles.cardValue}>{typeof value === 'number' ? number.format(value) : value}</Text></View>;
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text>{rows.length ? rows.map((row) => <View key={row.label} style={styles.row}><Text style={styles.rowLabel}>{row.label}</Text><Text style={styles.rowValue}>{number.format(row.count)}</Text></View>) : <Text style={styles.emptyText}>Мэдээлэл алга.</Text>}</View>;
}

export default function AdminDataScreen() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ready' | 'auth' | 'forbidden' | 'error'>('ready');

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getAdminDashboard()); setStatus('ready'); }
    catch (error) {
      setData(null);
      setStatus(error instanceof AdminApiError && error.status === 401 ? 'auth' : error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <SafeAreaView style={styles.page}><SeoHead title="ENKH Admin Data" description="ENKH-ийн хамгаалагдсан админ мэдээллийн самбар." path="/admin/data" noIndex /><AppHeader /><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.heading}><View><Text accessibilityRole="header" style={styles.title}>Enkh Data Dashboard</Text><Text style={styles.subtitle}>Admin-only, read-only system overview</Text></View>{data && <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.refresh}><Text style={styles.refreshText}>Шинэчлэх</Text></Pressable>}</View>
    {loading && <View style={styles.state}><ActivityIndicator color="#171717" /><Text style={styles.stateTitle}>Dashboard ачаалж байна…</Text></View>}
    {!loading && status === 'auth' && <View style={styles.state}><Text style={styles.stateTitle}>Нэвтрэх шаардлагатай</Text><Text style={styles.emptyText}>Энэ хэсэг зөвхөн ENKH админ хэрэглэгчдэд нээлттэй.</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(adminLoginUrl)} style={styles.primary}><Text style={styles.primaryText}>Auth0-оор нэвтрэх</Text></Pressable></View>}
    {!loading && status === 'forbidden' && <View style={styles.state}><Text style={styles.stateTitle}>Админ эрх шаардлагатай</Text><Text style={styles.emptyText}>Таны account энэ dashboard-ийг харах permission-гүй байна.</Text></View>}
    {!loading && status === 'error' && <View style={styles.state}><Text style={styles.stateTitle}>Dashboard мэдээлэл авах боломжгүй</Text><Text style={styles.emptyText}>Түр хүлээгээд дахин оролдоно уу.</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primary}><Text style={styles.primaryText}>Дахин оролдох</Text></Pressable></View>}
    {!loading && data && <>
      <View style={styles.cards}><Card label="Knowledge vectors" value={data.overview.knowledgeVectors}/><Card label="Chat messages" value={data.overview.chatMessages}/><Card label="Distinct sessions" value={data.overview.distinctSessions}/><Card label="Sources" value={data.overview.sources}/><Card label="System health" value={data.overview.systemHealth}/></View>
      <Text style={styles.sectionTitle}>Knowledge</Text><View style={styles.grid}><Breakdown title="Collections" rows={data.knowledge.collections}/><Breakdown title="Sources" rows={data.knowledge.sources}/><Breakdown title="Categories" rows={data.knowledge.categories}/><Breakdown title="Languages" rows={data.knowledge.languages}/></View>
      <View style={styles.panel}><Text style={styles.panelTitle}>Latest ingested knowledge</Text>{data.knowledge.latest.length ? data.knowledge.latest.map((item, index) => <View key={`${item.title}-${index}`} style={styles.latest}><Text style={styles.latestTitle}>{item.title}</Text><Text style={styles.meta}>{[item.source,item.category,item.language,item.ingestedAt].filter(Boolean).join(' · ')}</Text></View>) : <Text style={styles.emptyText}>Шинээр бүртгэгдсэн мэдээлэл алга.</Text>}</View>
      <Text style={styles.sectionTitle}>AI Tool Usage</Text><View style={styles.cards}><Card label="knowledge_base" value={data.toolUsage.knowledge_base}/><Card label="google_search" value={data.toolUsage.google_search}/><Card label="wikipedia_search" value={data.toolUsage.wikipedia_search}/><Card label="deepseek_china" value={data.toolUsage.deepseek_china}/></View>
      <Text style={styles.sectionTitle}>Memory</Text><View style={styles.cards}><Card label="Total messages" value={data.memory.totalMessages}/><Card label="Distinct sessions" value={data.memory.distinctSessions}/></View>
      <Text style={styles.sectionTitle}>Health</Text><View style={styles.cards}><Card label="Status" value={data.health.status}/><Card label="Read-only" value={data.health.readOnly ? 'Yes' : 'No'}/><Card label="Generated at" value={data.health.generatedAt || 'Unknown'}/></View>
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F7F7F5'},content:{width:'100%',maxWidth:1120,alignSelf:'center',paddingHorizontal:20,paddingBottom:48},heading:{paddingVertical:28,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:12},title:{fontSize:34,fontWeight:'900',color:'#171717'},subtitle:{marginTop:6,fontSize:14,color:'#707070'},refresh:{minHeight:44,justifyContent:'center',paddingHorizontal:16,borderRadius:12,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DDD'},refreshText:{fontWeight:'800',color:'#171717'},
  cards:{flexDirection:'row',flexWrap:'wrap',gap:12},card:{flexGrow:1,flexBasis:180,minHeight:126,padding:20,borderRadius:18,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},cardLabel:{fontSize:12,fontWeight:'800',letterSpacing:.5,color:'#777'},cardValue:{marginTop:16,fontSize:28,fontWeight:'900',color:'#171717'},sectionTitle:{marginTop:34,marginBottom:14,fontSize:22,fontWeight:'900',color:'#171717'},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},panel:{flexGrow:1,flexBasis:320,marginTop:12,padding:20,borderRadius:18,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},panelTitle:{marginBottom:14,fontSize:16,fontWeight:'900',color:'#171717'},row:{minHeight:38,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:'#EEE'},rowLabel:{flex:1,fontSize:14,color:'#444'},rowValue:{fontSize:14,fontWeight:'900',color:'#171717'},latest:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#EEE'},latestTitle:{fontSize:15,fontWeight:'800',color:'#202020'},meta:{marginTop:5,fontSize:12,color:'#777'},state:{minHeight:280,alignItems:'center',justifyContent:'center',padding:28,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},stateTitle:{marginTop:12,fontSize:20,fontWeight:'900',color:'#171717'},emptyText:{marginTop:8,fontSize:14,lineHeight:21,color:'#777'},primary:{minHeight:46,justifyContent:'center',marginTop:18,paddingHorizontal:18,borderRadius:12,backgroundColor:'#171717'},primaryText:{color:'#FFF',fontWeight:'800'}
});
