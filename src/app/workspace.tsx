import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';
import { clearWorkspace, deleteSession, loadWorkspace, saveWorkspace, WorkspaceSession, WorkspaceState } from '../workspace-store';

export default function WorkspaceScreen() {
  const [state, setState] = useState<WorkspaceState>({ version: 1, sessions: [], entries: [] });
  const [issue, setIssue] = useState<'unavailable' | 'corrupt' | undefined>();
  const [confirming, setConfirming] = useState('');

  const reload = useCallback(() => {
    const loaded = loadWorkspace();
    setState(loaded.state);
    setIssue(loaded.issue);
  }, []);
  useFocusEffect(reload);

  const open = (session: WorkspaceSession) => {
    if (session.type === 'chat') router.push({ pathname: '/chat', params: { sessionId: session.id } });
    else if (session.type === 'search') router.push({ pathname: '/search', params: { sessionId: session.id } });
    else router.push({ pathname: '/tools/calculation', params: { sessionId: session.id } });
  };

  const remove = (session: WorkspaceSession) => { const next = deleteSession(state, session.id); if (saveWorkspace(next)) { setState(next); setConfirming(''); } };
  const clearAll = () => { if (clearWorkspace()) { setState({ version: 1, sessions: [], entries: [] }); setConfirming(''); } };

  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="workspace" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingText}><Text accessibilityRole="header" style={styles.title}>Workspace</Text><Text style={styles.subtitle}>Энэ browser дээр хадгалсан таны conversation болон work history.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/chat')} style={styles.newButton}><Text style={styles.newButtonText}>+ Шинэ chat</Text></Pressable>
        </View>

        {issue && <View style={styles.notice}><Text style={styles.noticeTitle}>{issue === 'corrupt' ? 'History өгөгдөл уншигдсангүй' : 'Browser storage ашиглах боломжгүй'}</Text><Text style={styles.noticeText}>ENKH хоосон workspace-ээр аюулгүй үргэлжилж байна.</Text></View>}

        {!state.sessions.length ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>Одоогоор history алга</Text><Text style={styles.emptyText}>Chat, Search эсвэл Calculation ажиллуулахад session энд автоматаар хадгалагдана.</Text></View>
        ) : (
          <View style={styles.list}>
            {state.sessions.map((session) => (
              <View key={session.id} style={styles.session}>
                <Pressable accessibilityRole="link" accessibilityLabel={`${session.title} session нээх`} onPress={() => open(session)} style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}>
                  <Text style={styles.kind}>{session.type.toUpperCase()}</Text><Text numberOfLines={2} style={styles.sessionTitle}>{session.title}</Text><Text style={styles.date}>{new Date(session.updatedAt).toLocaleString()}</Text>
                </Pressable>
                {confirming === session.id ? <View accessibilityLiveRegion="polite" style={styles.confirm}><Text style={styles.confirmText}>Устгах уу?</Text><Pressable accessibilityRole="button" accessibilityLabel={`${session.title} session устгахыг батлах`} onPress={() => remove(session)} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Тийм</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Устгахыг болих" onPress={() => setConfirming('')} style={styles.cancel}><Text style={styles.cancelText}>Үгүй</Text></Pressable></View> : <Pressable accessibilityRole="button" accessibilityLabel={`${session.title} session устгах`} onPress={() => setConfirming(session.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Устгах</Text></Pressable>}
              </View>
            ))}
          </View>
        )}

        {!!state.sessions.length && (confirming === 'all' ? <View style={styles.clearConfirm}><Text style={styles.confirmText}>Бүх local history-г устгах уу?</Text><Pressable accessibilityRole="button" onPress={clearAll} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Бүгдийг устгах</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirming('')} style={styles.cancel}><Text style={styles.cancelText}>Болих</Text></Pressable></View> : <Pressable accessibilityRole="button" accessibilityLabel="Бүх local history цэвэрлэх" onPress={() => setConfirming('all')} style={styles.clearButton}><Text style={styles.clearText}>Бүх history-г цэвэрлэх</Text></Pressable>)}
        <Text style={styles.privacy}>Privacy: өгөгдөл зөвхөн энэ browser-ийн localStorage-д хадгалагдана. Account эсвэл server sync одоогоор байхгүй.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F7F7F5'}, content:{width:'100%',maxWidth:960,alignSelf:'center',paddingHorizontal:20,paddingTop:38,paddingBottom:56},
  headingRow:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:16},headingText:{flex:1,minWidth:240},title:{fontSize:40,fontWeight:'900',color:'#171717'},subtitle:{marginTop:8,fontSize:15,lineHeight:22,color:'#686868'},
  newButton:{minHeight:48,justifyContent:'center',paddingHorizontal:18,borderRadius:14,backgroundColor:'#171717'},newButtonText:{color:'#FFF',fontWeight:'800'},
  notice:{marginTop:24,padding:18,borderRadius:16,backgroundColor:'#FFF4E3',borderWidth:1,borderColor:'#E9C98B'},noticeTitle:{fontWeight:'800',color:'#6F4A13'},noticeText:{marginTop:5,color:'#765A31'},
  empty:{marginTop:28,minHeight:240,alignItems:'center',justifyContent:'center',padding:24,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},emptyTitle:{fontSize:20,fontWeight:'900',color:'#171717'},emptyText:{marginTop:9,maxWidth:480,textAlign:'center',fontSize:15,lineHeight:23,color:'#777'},
  list:{marginTop:28,gap:10},session:{minHeight:106,flexDirection:'row',alignItems:'center',borderRadius:18,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},openArea:{flex:1,minHeight:104,justifyContent:'center',padding:18},kind:{fontSize:10,letterSpacing:1.3,fontWeight:'900',color:'#777'},sessionTitle:{marginTop:6,fontSize:17,lineHeight:23,fontWeight:'800',color:'#171717'},date:{marginTop:5,fontSize:12,color:'#888'},
  deleteButton:{minWidth:76,minHeight:48,alignItems:'center',justifyContent:'center',marginRight:12,borderRadius:12,backgroundColor:'#F3F1EE'},deleteText:{fontSize:13,fontWeight:'800',color:'#8B2C20'},confirm:{marginRight:10,alignItems:'center',gap:4},confirmText:{fontSize:12,fontWeight:'800',color:'#6A3129'},confirmDelete:{minHeight:44,minWidth:58,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#8B2C20'},confirmDeleteText:{color:'#FFF',fontSize:12,fontWeight:'800'},cancel:{minHeight:44,minWidth:58,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#EEEDEA'},cancelText:{fontSize:12,fontWeight:'800',color:'#444'},clearButton:{alignSelf:'flex-start',minHeight:48,justifyContent:'center',marginTop:24,paddingHorizontal:16,borderRadius:12,borderWidth:1,borderColor:'#D8B8B2'},clearText:{fontSize:13,fontWeight:'800',color:'#8B2C20'},clearConfirm:{marginTop:24,alignSelf:'flex-start',flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},privacy:{marginTop:28,fontSize:12,lineHeight:19,color:'#888'},pressed:{opacity:.7},
});
