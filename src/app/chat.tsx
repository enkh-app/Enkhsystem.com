import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionApiError, sendMessage } from '../api';
import { AppHeader } from '../components/app-header';
import { addEntry, contextFor, createSession, emptyWorkspace, entriesFor, loadWorkspace, saveWorkspace, WorkspaceEntry, WorkspaceState } from '../workspace-store';
import { backgroundWorkspaceSync } from '../workspace-sync';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ prompt?: string; sessionId?: string }>();
  const initialPrompt = typeof params.prompt === 'string' ? params.prompt : '';
  const requestedSessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace());
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<WorkspaceEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedText, setFailedText] = useState('');
  const [failureKind, setFailureKind] = useState<'validation' | 'network'>('network');
  const [storageWarning, setStorageWarning] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const initialSent = useRef(false);

  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded.state);
    if (requestedSessionId) { setSessionId(requestedSessionId); setMessages(entriesFor(loaded.state, requestedSessionId)); }
    else { setSessionId(''); setMessages([]); setFailedText(''); }
    if (loaded.issue) setStorageWarning('History хадгалах боломжгүй байна.');
  }, [requestedSessionId]);

  const persist = (next: WorkspaceState) => {
    setWorkspace(next);
    if (!saveWorkspace(next)) setStorageWarning('History хадгалах боломжгүй байна. Энэ session зөвхөн одоогийн дэлгэцэд үлдэнэ.');
  };

  const send = async (value = input, retry = false) => {
    const text = value.trim();
    if (!text || loading) return;
    setInput('');
    setFailedText('');
    setLoading(true);

    let next = workspace;
    let activeId = sessionId;
    if (!activeId) {
      const created = createSession(next, 'chat', text);
      next = created.state;
      activeId = created.session.id;
      setSessionId(activeId);
      router.setParams({ sessionId: activeId, prompt: undefined });
    }

    const previousEntries = entriesFor(next, activeId);
    if (!retry) next = addEntry(next, { sessionId: activeId, role: 'user', type: 'message', content: text });
    persist(next);
    setMessages(entriesFor(next, activeId));

    try {
      const response = await sendMessage(text, contextFor(previousEntries));
      const answer = response.answer || response.message || response.response || response.content;
      if (!answer?.trim()) throw new Error('Empty AI answer');
      next = addEntry(next, { sessionId: activeId, role: 'assistant', type: 'message', content: answer.trim() });
      persist(next);
      setMessages(entriesFor(next, activeId));
      backgroundWorkspaceSync.schedule(next);
    } catch (error) {
      setFailureKind(error instanceof ActionApiError && error.status >= 400 && error.status < 500 ? 'validation' : 'network');
      setFailedText(text);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !initialSent.current) { initialSent.current = true; setInput(initialPrompt); void send(initialPrompt); }
  }, [initialPrompt]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages, loading, failedText]);

  return (
    <SafeAreaView style={styles.page}>
      <AppHeader active="chat" />
      <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.intro}><View><Text accessibilityRole="header" style={styles.title}>ENKH Chat</Text><Text style={styles.subtitle}>{sessionId ? 'Энэ conversation browser дээр автоматаар хадгалагдана.' : 'Шинэ conversation эхлүүлэх асуултаа бичнэ үү.'}</Text></View>{sessionId && <Pressable accessibilityRole="button" onPress={() => router.replace('/chat')} style={styles.newChat}><Text style={styles.newChatText}>+ Шинэ chat</Text></Pressable>}</View>
        {!!storageWarning && <Text accessibilityLiveRegion="polite" style={styles.warning}>{storageWarning}</Text>}
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
          {!messages.length && <View style={[styles.row, styles.enkhRow]}><View style={[styles.bubble, styles.enkhBubble]}><Text style={styles.message}>Сайн байна уу. Би ENKH AI. Танд юугаар туслах вэ?</Text></View></View>}
          {messages.map((message) => <View key={message.id} style={[styles.row, message.role === 'user' ? styles.userRow : styles.enkhRow]}><View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.enkhBubble]}><Text style={[styles.message, message.role === 'user' && styles.userMessage]}>{message.content}</Text></View></View>)}
          {loading && <View accessibilityLiveRegion="polite" style={styles.thinking}><ActivityIndicator color="#171717" /><Text style={styles.thinkingText}>ENKH бодож байна…</Text></View>}
          {!!failedText && <View accessibilityLiveRegion="assertive" style={styles.failure}><Text style={styles.failureText}>{failureKind === 'validation' ? 'Хүсэлтийн мэдээллийг шалгаад дахин оролдоно уу.' : 'Сүлжээ эсвэл үйлчилгээний түр алдаа гарлаа.'} Таны асуулт history-д хадгалагдсан.</Text><Pressable accessibilityRole="button" accessibilityLabel="Сүүлийн асуултыг дахин оролдох" onPress={() => void send(failedText, true)} style={styles.retry}><Text style={styles.retryText}>Дахин оролдох</Text></Pressable></View>}
        </ScrollView>
        <View style={styles.composer}><TextInput accessibilityLabel="Chat асуулт" editable={!loading} multiline value={input} onChangeText={setInput} onSubmitEditing={() => void send()} placeholder="ENKH-ээс юм асуух…" placeholderTextColor="#888" style={styles.input} submitBehavior="submit"/><Pressable accessibilityRole="button" accessibilityLabel="Асуулт илгээх" disabled={!input.trim() || loading} onPress={() => void send()} style={({ pressed }) => [styles.send, (!input.trim() || loading) && styles.disabled, pressed && styles.pressed]}><Text style={styles.sendText}>Илгээх ↑</Text></Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F7F7F5'},layout:{flex:1,width:'100%',maxWidth:920,alignSelf:'center',paddingHorizontal:20,paddingBottom:16},intro:{paddingTop:20,paddingBottom:14,flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12},title:{fontSize:30,fontWeight:'900',color:'#171717'},subtitle:{marginTop:5,fontSize:14,lineHeight:21,color:'#707070'},newChat:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderRadius:12,backgroundColor:'#FFF'},newChatText:{fontSize:13,fontWeight:'800',color:'#171717'},warning:{marginBottom:10,padding:10,borderRadius:10,backgroundColor:'#FFF4E3',color:'#6F4A13',fontSize:12},messages:{flex:1,borderRadius:22,backgroundColor:'#F1F1EE'},messageContent:{padding:18,gap:16},row:{maxWidth:'86%'},enkhRow:{alignSelf:'flex-start'},userRow:{alignSelf:'flex-end'},bubble:{paddingHorizontal:17,paddingVertical:13,borderRadius:18},enkhBubble:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},userBubble:{backgroundColor:'#171717'},message:{fontSize:16,lineHeight:24,color:'#202020'},userMessage:{color:'#FFF'},thinking:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:10,padding:14},thinkingText:{color:'#686868',fontSize:14},failure:{alignSelf:'stretch',padding:15,borderRadius:14,backgroundColor:'#FFF4F2',borderWidth:1,borderColor:'#F1C9C1'},failureText:{fontSize:13,lineHeight:20,color:'#744139'},retry:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',marginTop:9,paddingHorizontal:14,borderRadius:11,backgroundColor:'#8B2C20'},retryText:{color:'#FFF',fontSize:13,fontWeight:'800'},composer:{marginTop:12,minHeight:66,flexDirection:'row',alignItems:'flex-end',gap:8,padding:8,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DDD'},input:{flex:1,minHeight:48,maxHeight:140,paddingHorizontal:12,paddingVertical:12,color:'#171717',fontSize:16,lineHeight:23,textAlignVertical:'top'},send:{minHeight:48,justifyContent:'center',paddingHorizontal:17,borderRadius:14,backgroundColor:'#171717'},sendText:{color:'#FFF',fontSize:14,fontWeight:'800'},disabled:{opacity:.3},pressed:{opacity:.7},
});
