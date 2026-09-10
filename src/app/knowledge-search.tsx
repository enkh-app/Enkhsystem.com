import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchWeb, SearchSource } from '../api';
import { AppHeader } from '../components/app-header';
import { SeoHead } from '../components/seo-head';
import { addEntry, createSession, emptyWorkspace, entriesFor, loadWorkspace, saveWorkspace, WorkspaceState } from '../workspace-store';
import { backgroundWorkspaceSync } from '../workspace-sync';

export default function KnowledgeSearchScreen() {
  const params = useLocalSearchParams<{ q?: string; sessionId?: string }>();
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const requestedSessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace());
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const initialSearched = useRef(false);

  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded.state);
    if (loaded.issue) setStorageWarning('History хадгалах боломжгүй байна.');
    if (requestedSessionId) {
      setSessionId(requestedSessionId);
      const restored = entriesFor(loaded.state, requestedSessionId);
      const restoredUser = [...restored].reverse().find((entry) => entry.role === 'user');
      const restoredAnswer = [...restored].reverse().find((entry) => entry.role === 'assistant');
      setQuery(restoredUser?.content || '');
      setAnswer(restoredAnswer?.content || '');
      setSources(restoredAnswer?.sources || []);
    }
  }, [requestedSessionId]);

  const persist = (next: WorkspaceState) => { setWorkspace(next); if (!saveWorkspace(next)) setStorageWarning('History хадгалах боломжгүй байна.'); };

  const search = async (value = query) => {
    const text = value.trim();
    if (!text || loading) return;
    setLoading(true); setError(''); setAnswer(''); setSources([]);

    let next = workspace;
    let activeId = sessionId;
    if (!activeId) {
      const created = createSession(next, 'search', text);
      next = created.state; activeId = created.session.id; setSessionId(activeId);
      router.setParams({ sessionId: activeId, q: undefined });
    }
    next = addEntry(next, { sessionId: activeId, role: 'user', type: 'search', content: text });
    persist(next);

    try {
      const response = await searchWeb(text);
      const result = response.data?.result;
      if (!result?.answer?.trim()) throw new Error('Empty search answer');
      const safeSources = (result.sources || []).filter((source) => /^https?:\/\//i.test(source.url));
      setAnswer(result.answer.trim()); setSources(safeSources);
      next = addEntry(next, { sessionId: activeId, role: 'assistant', type: 'search', content: result.answer.trim(), sources: safeSources });
      persist(next);
      backgroundWorkspaceSync.schedule(next);
    } catch { setError('Вэб хайлт хийхэд алдаа гарлаа. Query history-д хадгалагдсан тул дахин оролдож болно.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (initialQuery && !initialSearched.current) { initialSearched.current = true; setQuery(initialQuery); void search(initialQuery); } }, [initialQuery]);

  return (
    <SafeAreaView style={styles.page}><SeoHead title="ENKH Хайлт — Эх сурвалжтай вэб хайлт" description="Вэбээс мэдээлэл хайж, ENKH-ийн нэгтгэсэн хариу болон ашигласан эх сурвалжуудыг хамтад нь аваарай." path="/search" /><AppHeader active="search" /><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Эх сурвалжтай вэб хайлт</Text><Text style={styles.subtitle}>{sessionId ? 'Хадгалсан хайлтын үр дүн. Дахин нээхэд API дахин дуудагдахгүй.' : 'Бодит вэбээс хайж, хариу болон эх сурвалжийг session-д хадгална.'}</Text></View>
      {!!storageWarning && <Text style={styles.warning}>{storageWarning}</Text>}
      <View style={styles.searchBox}><TextInput accessibilityLabel="Вэб хайлтын асуулт" editable={!loading} value={query} onChangeText={setQuery} onSubmitEditing={() => void search()} placeholder="Юу хайх вэ?" placeholderTextColor="#888" returnKeyType="search" style={styles.input}/><Pressable accessibilityRole="button" accessibilityLabel="Вэбээс хайх" disabled={!query.trim() || loading} onPress={() => void search()} style={({pressed})=>[styles.button,(!query.trim()||loading)&&styles.disabled,pressed&&styles.pressed]}><Text style={styles.buttonText}>Хайх</Text></Pressable></View>
      {loading&&<View accessibilityLiveRegion="polite" style={styles.state}><ActivityIndicator color="#171717"/><Text style={styles.stateText}>Вэбээс хайж байна…</Text></View>}
      {!!error&&<View accessibilityLiveRegion="assertive" style={styles.error}><Text style={styles.errorTitle}>Хайлт амжилтгүй</Text><Text style={styles.errorText}>{error}</Text></View>}
      {!!answer&&<View style={styles.results}><View style={styles.answerCard}><Text style={styles.label}>ENKH ХАРИУЛТ</Text><Text style={styles.answer}>{answer}</Text></View><Text accessibilityRole="header" style={styles.sourcesTitle}>Эх сурвалж ({sources.length})</Text>{sources.length?sources.map((source,index)=><Pressable key={`${source.url}-${index}`} accessibilityRole="link" accessibilityLabel={`${source.title} эх сурвалжийг нээх`} onPress={()=>void Linking.openURL(source.url)} style={({pressed})=>[styles.source,pressed&&styles.pressed]}><View style={styles.sourceText}><Text numberOfLines={2} style={styles.sourceTitle}>{source.title||source.source||'Эх сурвалж'}</Text><Text numberOfLines={1} style={styles.sourceUrl}>{source.source||source.url}</Text></View><Text style={styles.arrow}>↗</Text></Pressable>):<Text style={styles.noSources}>Энэ хариунд тусдаа эх сурвалж ирсэнгүй.</Text>}</View>}
    </ScrollView></SafeAreaView>
  );
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:920,alignSelf:'center',paddingHorizontal:20,paddingTop:42,paddingBottom:56},heading:{maxWidth:720},title:{fontSize:38,lineHeight:46,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:12,fontSize:16,lineHeight:24,color:'#627D98'},warning:{marginTop:16,padding:10,borderRadius:10,backgroundColor:'#FFF4E3',color:'#6F4A13',fontSize:12},searchBox:{marginTop:28,flexDirection:'row',alignItems:'center',gap:8,padding:8,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#D7E4F3'},input:{flex:1,minHeight:48,paddingHorizontal:13,fontSize:16,color:'#102A43'},button:{minHeight:48,justifyContent:'center',paddingHorizontal:22,borderRadius:14,backgroundColor:'#0B57D0'},buttonText:{color:'#FFF',fontWeight:'800'},disabled:{opacity:.3},pressed:{opacity:.7},state:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:44,justifyContent:'center'},stateText:{color:'#627D98'},error:{marginTop:24,padding:20,borderRadius:18,backgroundColor:'#FFF4F2',borderWidth:1,borderColor:'#F1C9C1'},errorTitle:{fontSize:16,fontWeight:'800',color:'#8B2C20'},errorText:{marginTop:6,fontSize:14,lineHeight:21,color:'#744139'},results:{marginTop:28,gap:12},answerCard:{padding:24,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},label:{fontSize:11,letterSpacing:1.8,fontWeight:'900',color:'#829AB1'},answer:{marginTop:14,fontSize:16,lineHeight:26,color:'#243B53'},sourcesTitle:{marginTop:18,fontSize:20,fontWeight:'900',color:'#102A43'},source:{minHeight:76,flexDirection:'row',alignItems:'center',padding:16,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},sourceText:{flex:1},sourceTitle:{fontSize:15,lineHeight:21,fontWeight:'700',color:'#243B53'},sourceUrl:{marginTop:4,fontSize:12,color:'#627D98'},arrow:{marginLeft:12,fontSize:20,color:'#0B57D0'},noSources:{color:'#627D98',fontSize:14}});
