import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/app-header';
import { SeoHead } from '../components/seo-head';
import { AdminApiError, getAuthState, getCloudWorkspace, importCloudWorkspace, syncCloudWorkspace } from '../api';
import { actionIdForSession, BackupInspection, clearWorkspace, deleteSession, inspectWorkspaceBackup, loadWorkspace, replaceWorkspaceSafely, restoreWorkspaceBackup, saveWorkspace, workspaceSessionLabel, WorkspaceSession, WorkspaceState } from '../workspace-store';
import { backgroundWorkspaceSync, workspaceSyncLabel, WorkspaceSyncSnapshot } from '../workspace-sync';

export default function WorkspaceScreen() {
  const [state, setState] = useState<WorkspaceState>({ version: 1, sessions: [], entries: [] });
  const [issue, setIssue] = useState<'unavailable' | 'corrupt' | undefined>();
  const [confirming, setConfirming] = useState('');
  const [cloud, setCloud] = useState<{ authenticated: boolean; revision: number; workspace: WorkspaceState | null }>({ authenticated: false, revision: 0, workspace: null });
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudNotice, setCloudNotice] = useState('');
  const [backup, setBackup] = useState<BackupInspection>(() => inspectWorkspaceBackup());
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  const [showCloudDetails, setShowCloudDetails] = useState(false);
  const [showBackupDetails, setShowBackupDetails] = useState(false);
  const [sync, setSync] = useState<WorkspaceSyncSnapshot>(backgroundWorkspaceSync.getSnapshot());

  useEffect(() => { const unsubscribe = backgroundWorkspaceSync.subscribe(() => setSync(backgroundWorkspaceSync.getSnapshot())); return () => { unsubscribe(); }; }, []);

  const reload = useCallback(() => {
    const loaded = loadWorkspace();
    setState(loaded.state);
    setIssue(loaded.issue);
    setBackup(inspectWorkspaceBackup());
  }, []);
  useFocusEffect(reload);

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      try {
        const auth = await getAuthState();
        if (!auth.authenticated || !active) return;
        const remote = await getCloudWorkspace();
        if (active) setCloud({ authenticated: true, revision: remote.revision, workspace: remote.workspace as WorkspaceState | null });
      } catch { if (active) setCloudNotice('Cloud workspace төлөвийг шалгаж чадсангүй. Local history хэвээр байна.'); }
    })();
    return () => { active = false; };
  }, []));

  const importLocal = async () => {
    setCloudBusy(true); setCloudNotice('');
    try { const saved = await importCloudWorkspace(state); setCloud({ authenticated: true, revision: saved.revision, workspace: saved.workspace as WorkspaceState }); await backgroundWorkspaceSync.bind(saved.revision, state); setCloudNotice('Local workspace cloud-д аюулгүй import хийгдлээ.'); }
    catch (error) { setCloudNotice(error instanceof AdminApiError && error.status === 409 ? 'Cloud workspace аль хэдийн байна. Эхлээд cloud copy-г ачаална уу.' : 'Import амжилтгүй. Local history өөрчлөгдөөгүй.'); }
    finally { setCloudBusy(false); }
  };
  const syncLocal = async () => {
    setCloudBusy(true); setCloudNotice('');
    try { const expectedRevision = backgroundWorkspaceSync.getSnapshot().revision || cloud.revision; const saved = await syncCloudWorkspace(state, expectedRevision); setCloud({ authenticated: true, revision: saved.revision, workspace: saved.workspace as WorkspaceState }); await backgroundWorkspaceSync.bind(saved.revision, state); setCloudNotice('Cloud workspace шинэчлэгдлээ.'); }
    catch (error) { setCloudNotice(error instanceof AdminApiError && error.status === 409 ? 'Өөр төхөөрөмж дээр cloud workspace өөрчлөгдсөн. Cloud copy-г дахин ачаална уу.' : 'Sync амжилтгүй. Local history өөрчлөгдөөгүй.'); }
    finally { setCloudBusy(false); }
  };
  const loadCloud = () => {
    if (cloud.workspace && replaceWorkspaceSafely(cloud.workspace)) { setState(cloud.workspace); setBackup(inspectWorkspaceBackup()); void backgroundWorkspaceSync.bind(cloud.revision, cloud.workspace); setCloudNotice('Cloud copy ачааллаа. Өмнөх local copy backup хэлбэрээр хадгалагдсан.'); }
    else setCloudNotice('Cloud copy ачаалж чадсангүй. Local history өөрчлөгдөөгүй.');
  };
  const restoreBackup = () => {
    const restored = restoreWorkspaceBackup();
    if (!restored) { setCloudNotice('Backup schema буруу эсвэл сэргээх боломжгүй. Одоогийн local workspace өөрчлөгдөөгүй.'); setConfirmingRestore(false); return; }
    setState(restored.state);
    setBackup(inspectWorkspaceBackup());
    backgroundWorkspaceSync.markLocalDivergent();
    setConfirmingRestore(false);
    setCloudNotice(`Backup local workspace-д сэргээгдлээ. Cloud revision ${cloud.revision} өөрчлөгдөөгүй; бэлэн болсон үед manual sync хийнэ.`);
  };

  const open = (session: WorkspaceSession) => {
    if (session.type === 'chat') router.push({ pathname: '/chat', params: { sessionId: session.id } });
    else if (session.type === 'search') router.push({ pathname: '/search', params: { sessionId: session.id } });
    else {
      const actionId = actionIdForSession(state, session.id);
      if (actionId === 'text') { router.push({ pathname: '/action/[id]', params: { id: 'text', sessionId: session.id } }); return; }
      const path = actionId === 'message' ? '/action-message' : actionId === 'document' ? '/action-document' : actionId === 'calculation' ? '/tools/calculation' : '/tools';
      router.push({ pathname: path, params: { sessionId: session.id } });
    }
  };

  const remove = (session: WorkspaceSession) => { const next = deleteSession(state, session.id); if (saveWorkspace(next)) { setState(next); setConfirming(''); backgroundWorkspaceSync.schedule(next); } };
  const clearAll = () => { const next: WorkspaceState = { version: 1, sessions: [], entries: [] }; if (clearWorkspace()) { setState(next); setConfirming(''); backgroundWorkspaceSync.schedule(next); } };

  return (
    <SafeAreaView style={styles.page}>
      <SeoHead title="ENKH Workspace" description="ENKH дээр хадгалсан хувийн яриа, хайлт, тооцоолол болон нооргуудын workspace." path="/workspace" noIndex />
      <AppHeader active="workspace" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingText}><Text accessibilityRole="header" style={styles.title}>Workspace</Text><Text style={styles.subtitle}>Таны хадгалсан яриа, хайлт, тооцоолол болон бэлтгэсэн нооргууд.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/chat')} style={styles.newButton}><Text style={styles.newButtonText}>+ Шинэ chat</Text></Pressable>
        </View>

        {issue && <View style={styles.notice}><Text style={styles.noticeTitle}>{issue === 'corrupt' ? 'History өгөгдөл уншигдсангүй' : 'Browser storage ашиглах боломжгүй'}</Text><Text style={styles.noticeText}>ENKH хоосон workspace-ээр аюулгүй үргэлжилж байна.</Text></View>}

          {cloud.authenticated && <View style={styles.cloudCard}><Text style={styles.cardEyebrow}>CLOUD WORKSPACE</Text><Text style={styles.cloudStatus}>{workspaceSyncLabel(sync.phase)}</Text><Text style={styles.noticeText}>{cloud.workspace ? 'Таны өөрчлөлт local-д шууд хадгалагдаж, cloud руу аюулгүй sync хийгдэнэ.' : 'Cloud copy хоосон байна. Local workspace-аа та өөрөө сонгож import хийнэ.'}</Text><View style={styles.cloudActions}>{!cloud.workspace ? <Pressable disabled={cloudBusy} accessibilityRole="button" onPress={() => void importLocal()} style={styles.newButton}><Text style={styles.newButtonText}>Local workspace import</Text></Pressable> : <><Pressable disabled={cloudBusy} accessibilityRole="button" onPress={() => void syncLocal()} style={styles.newButton}><Text style={styles.newButtonText}>Cloud руу sync</Text></Pressable><Pressable disabled={cloudBusy} accessibilityRole="button" onPress={loadCloud} style={styles.cancel}><Text style={styles.cancelText}>Cloud copy ачаалах</Text></Pressable></>}</View><Pressable accessibilityRole="button" onPress={() => setShowCloudDetails((value) => !value)} style={styles.detailsButton}><Text style={styles.detailsText}>{showCloudDetails ? 'Дэлгэрэнгүйг нуух' : 'Дэлгэрэнгүй'}</Text></Pressable>{showCloudDetails && <Text style={styles.secondaryMeta}>Cloud revision {cloud.revision} · Manual sync нь fallback хэлбэрээр ажиллана.</Text>}</View>}
        {!!cloudNotice && <Text accessibilityLiveRegion="polite" style={styles.warning}>{cloudNotice}</Text>}

        {backup.exists && <View style={styles.backupCard}>
          <Text style={styles.cardEyebrow}>СЭРГЭЭЛТИЙН BACKUP</Text><Text style={styles.backupTitle}>Local backup {backup.valid ? 'бэлэн' : 'уншигдсангүй'}</Text>
          {backup.valid ? <>
            <Text style={styles.noticeText}>Нийт {backup.sessionCount} ажил · Chat {backup.counts.chat} · Хайлт {backup.counts.search} · Бусад ажил {backup.counts.action}</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowBackupDetails((value) => !value)} style={styles.detailsButton}><Text style={styles.detailsText}>{showBackupDetails ? 'Backup мэдээллийг нуух' : 'Backup мэдээлэл'}</Text></Pressable>{showBackupDetails && <Text style={styles.backupMeta}>Schema v{backup.schemaVersion}{backup.timestamp ? ` · Сүүлийн local update: ${new Date(backup.timestamp).toLocaleString()}` : ''}</Text>}
            {confirmingRestore ? <View style={styles.restoreConfirm}><Text style={styles.confirmText}>Одоогийн local copy тусдаа snapshot болж хадгалагдана. Cloud revision {cloud.revision} өөрчлөгдөхгүй. Backup-аас сэргээх үү?</Text><Pressable accessibilityRole="button" onPress={restoreBackup} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Сэргээх</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirmingRestore(false)} style={styles.cancel}><Text style={styles.cancelText}>Болих</Text></Pressable></View> : <Pressable accessibilityRole="button" onPress={() => setConfirmingRestore(true)} style={styles.restoreButton}><Text style={styles.restoreButtonText}>Backup-аас сэргээх</Text></Pressable>}
          </> : <Text style={styles.noticeText}>Backup schema баталгаажаагүй тул restore хаалттай. Одоогийн local data өөрчлөгдөөгүй.</Text>}
        </View>}

        {!state.sessions.length ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>Одоогоор хадгалсан ажил алга</Text><Text style={styles.emptyText}>Chat, Хайлт эсвэл Tools ашиглахад таны ажлууд энд автоматаар хадгалагдана.</Text></View>
        ) : (
          <View style={styles.list}>
            {state.sessions.map((session) => (
              <View key={session.id} style={styles.session}>
                <Pressable accessibilityRole="link" accessibilityLabel={`${session.title} session нээх`} onPress={() => open(session)} style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}>
                  <Text style={styles.kind}>{workspaceSessionLabel(state, session)}</Text><Text numberOfLines={2} style={styles.sessionTitle}>{session.title}</Text><Text style={styles.date}>{new Date(session.updatedAt).toLocaleString()}</Text>
                </Pressable>
                {confirming === session.id ? <View accessibilityLiveRegion="polite" style={styles.confirm}><Text style={styles.confirmText}>Устгах уу?</Text><Pressable accessibilityRole="button" accessibilityLabel={`${session.title} session устгахыг батлах`} onPress={() => remove(session)} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Тийм</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Устгахыг болих" onPress={() => setConfirming('')} style={styles.cancel}><Text style={styles.cancelText}>Үгүй</Text></Pressable></View> : <Pressable accessibilityRole="button" accessibilityLabel={`${session.title} session устгах`} onPress={() => setConfirming(session.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Устгах</Text></Pressable>}
              </View>
            ))}
          </View>
        )}

        {!!state.sessions.length && (confirming === 'all' ? <View style={styles.clearConfirm}><Text style={styles.confirmText}>Бүх local history-г устгах уу?</Text><Pressable accessibilityRole="button" onPress={clearAll} style={styles.confirmDelete}><Text style={styles.confirmDeleteText}>Бүгдийг устгах</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirming('')} style={styles.cancel}><Text style={styles.cancelText}>Болих</Text></Pressable></View> : <Pressable accessibilityRole="button" accessibilityLabel="Бүх local history цэвэрлэх" onPress={() => setConfirming('all')} style={styles.clearButton}><Text style={styles.clearText}>Бүх history-г цэвэрлэх</Text></Pressable>)}
        <Text style={styles.privacy}>Таны local ажлууд болон сэргээх backup энэ browser-д хадгалагдана. Backup сэргээхэд cloud автоматаар өөрчлөгдөхгүй.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F4F8FD'}, content:{width:'100%',maxWidth:960,alignSelf:'center',paddingHorizontal:20,paddingTop:38,paddingBottom:56},
  headingRow:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:16},headingText:{flex:1,minWidth:240},title:{fontSize:40,fontWeight:'900',color:'#171717'},subtitle:{marginTop:8,fontSize:15,lineHeight:22,color:'#686868'},
  newButton:{minHeight:48,justifyContent:'center',paddingHorizontal:18,borderRadius:14,backgroundColor:'#0B57D0'},newButtonText:{color:'#FFF',fontWeight:'800'},
  notice:{marginTop:24,padding:18,borderRadius:16,backgroundColor:'#FFF4E3',borderWidth:1,borderColor:'#E9C98B'},noticeTitle:{fontWeight:'800',color:'#6F4A13'},noticeText:{marginTop:5,color:'#765A31'},
  cloudCard:{marginTop:24,padding:18,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#D6E5D8'},cardEyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:'#7B96B3'},cloudStatus:{marginTop:8,fontSize:20,fontWeight:'900',color:'#185C32'},cloudActions:{marginTop:14,flexDirection:'row',flexWrap:'wrap',gap:8},detailsButton:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',marginTop:8},detailsText:{fontSize:12,fontWeight:'800',color:'#486581'},secondaryMeta:{fontSize:12,lineHeight:18,color:'#829AB1'},warning:{marginTop:12,padding:10,borderRadius:10,backgroundColor:'#FFF4E3',color:'#6F4A13',fontSize:12},
  backupCard:{marginTop:16,padding:16,borderRadius:16,backgroundColor:'#F8FAFD',borderWidth:1,borderColor:'#DDE7F2'},backupTitle:{marginTop:7,fontSize:16,fontWeight:'800',color:'#486581'},backupMeta:{fontSize:12,color:'#6D6580'},restoreButton:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',marginTop:10,paddingHorizontal:14,borderRadius:11,borderWidth:1,borderColor:'#AFC1D5',backgroundColor:'#FFF'},restoreButtonText:{color:'#486581',fontSize:13,fontWeight:'800'},restoreConfirm:{marginTop:14,gap:8},
  empty:{marginTop:28,minHeight:240,alignItems:'center',justifyContent:'center',padding:24,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},emptyTitle:{fontSize:20,fontWeight:'900',color:'#171717'},emptyText:{marginTop:9,maxWidth:480,textAlign:'center',fontSize:15,lineHeight:23,color:'#777'},
  list:{marginTop:28,gap:10},session:{minHeight:106,flexDirection:'row',alignItems:'center',borderRadius:18,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},openArea:{flex:1,minHeight:104,justifyContent:'center',padding:18},kind:{fontSize:10,letterSpacing:1.3,fontWeight:'900',color:'#777'},sessionTitle:{marginTop:6,fontSize:17,lineHeight:23,fontWeight:'800',color:'#171717'},date:{marginTop:5,fontSize:12,color:'#888'},
  deleteButton:{minWidth:76,minHeight:48,alignItems:'center',justifyContent:'center',marginRight:12,borderRadius:12,backgroundColor:'#F3F1EE'},deleteText:{fontSize:13,fontWeight:'800',color:'#8B2C20'},confirm:{marginRight:10,alignItems:'center',gap:4},confirmText:{fontSize:12,fontWeight:'800',color:'#6A3129'},confirmDelete:{minHeight:44,minWidth:58,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#8B2C20'},confirmDeleteText:{color:'#FFF',fontSize:12,fontWeight:'800'},cancel:{minHeight:44,minWidth:58,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#EEEDEA'},cancelText:{fontSize:12,fontWeight:'800',color:'#444'},clearButton:{alignSelf:'flex-start',minHeight:48,justifyContent:'center',marginTop:24,paddingHorizontal:16,borderRadius:12,borderWidth:1,borderColor:'#D8B8B2'},clearText:{fontSize:13,fontWeight:'800',color:'#8B2C20'},clearConfirm:{marginTop:24,alignSelf:'flex-start',flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},privacy:{marginTop:28,fontSize:12,lineHeight:19,color:'#888'},pressed:{opacity:.7},
});
