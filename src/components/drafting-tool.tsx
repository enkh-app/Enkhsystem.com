import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { runAction } from '../api';
import { backgroundWorkspaceSync } from '../workspace-sync';
import { documentAfterEdit, documentFromResult, modelToEditableText, StructuredDocument } from '../document-model';
import { addEntry, createSession, entriesFor, loadWorkspace, makeId, saveWorkspace, updateEntryContent, updateEntryDocument } from '../workspace-store';
import { AppHeader } from './app-header';
import { SeoHead } from './seo-head';

type DraftKind = 'text' | 'message' | 'document';
type DraftResult = { type: string; content: string; document?: unknown; editable: boolean; sent?: boolean; exportCapabilities?: { docx: boolean; pdf: boolean }; [key: string]: unknown };

const textOperations = [
  ['polish', 'Засаж сайжруулах'], ['shorten', 'Богиносгох'], ['expand', 'Дэлгэрүүлэх'],
  ['summarize', 'Хураангуйлах'], ['translate', 'Орчуулах'], ['formal', 'Албан хэлбэр'],
] as const;
const tones = [['professional', 'Мэргэжлийн'], ['friendly', 'Найрсаг'], ['formal', 'Албан'], ['concise', 'Товч']] as const;
const documentTypes = [['letter', 'Албан бичиг'], ['proposal', 'Санал'], ['report', 'Тайлан'], ['memo', 'Тэмдэглэл'], ['other', 'Бусад']] as const;

export function DraftingTool({ kind }: { kind: DraftKind }) {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [operation, setOperation] = useState('polish');
  const [tone, setTone] = useState('professional');
  const [documentType, setDocumentType] = useState('letter');
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [recipient, setRecipient] = useState('');
  const [intent, setIntent] = useState('');
  const [context, setContext] = useState('');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [draft, setDraft] = useState('');
  const [draftEntryId, setDraftEntryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [documentModel, setDocumentModel] = useState<StructuredDocument | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (kind !== 'document' || !sessionId) return;
    const entry = [...entriesFor(loadWorkspace().state, sessionId)].reverse().find((item) => item.actionId === 'document');
    if (!entry) return;
    const model = documentFromResult(entry.structuredResult, entry.content);
    setDraft(model ? modelToEditableText(model) : entry.content); setDocumentModel(model); setDraftEntryId(entry.id);
  }, [kind, sessionId]);

  const labels = useMemo(() => ({
    text: ['Текст боловсруулах', 'Текстээ бодитоор засаж, богиносгож, дэлгэрүүлж, хураангуйлж эсвэл орчуулна.'],
    message: ['Мессеж бэлтгэх', 'Зорилго, нөхцөл болон өнгө аясаар editable мессежийн ноорог бэлтгэнэ.'],
    document: ['Баримт бичиг бэлтгэх', 'Төрөл, зорилго, нөхцөлд тохирсон бүтэцтэй editable ноорог бэлтгэнэ.'],
  }[kind]), [kind]);

  const input = kind === 'text'
    ? { operation, text, targetLanguage, instructions }
    : kind === 'message'
      ? { intent, context, tone, recipient }
      : { documentType, title, purpose, context, tone };
  const valid = kind === 'text' ? Boolean(text.trim() && (operation !== 'translate' || targetLanguage.trim())) : kind === 'message' ? Boolean(intent.trim()) : Boolean(purpose.trim());
  const sessionTitle = kind === 'text' ? text : kind === 'message' ? intent : title || purpose;

  const persist = (result: DraftResult) => {
    let next = loadWorkspace().state;
    const created = createSession(next, 'action', sessionTitle);
    next = created.state;
    const entryId = makeId();
    next = addEntry(next, { id: entryId, sessionId: created.session.id, role: 'assistant', type: 'action', content: result.content, actionId: kind, structuredResult: result });
    if (saveWorkspace(next)) { setDraftEntryId(entryId); backgroundWorkspaceSync.schedule(next); }
    else setNotice('Ноорог бэлэн болсон ч Workspace-д хадгалж чадсангүй. Текст дэлгэц дээр хэвээр байна.');
  };

  const generate = async () => {
    if (!valid || loading) return;
    setLoading(true); setError(''); setNotice('');
    try {
      const response = await runAction(kind, input);
      const result = response.data?.result as DraftResult | undefined;
      if (!result?.content?.trim()) throw new Error('Empty draft');
      const model = kind === 'document' ? documentFromResult(result, result.content) : null;
      setDocumentModel(model); setDraft(model ? modelToEditableText(model) : result.content.trim());
      if (model) persist({ ...result, content: modelToEditableText(model), document: model }); else persist(result);
    } catch {
      setError('Ноорог бэлтгэхэд холболтын алдаа гарлаа. Таны оруулсан мэдээлэл хэвээр байна; дахин оролдоно уу.');
    } finally { setLoading(false); }
  };

  const saveEdit = () => {
    if (!draftEntryId || !draft.trim()) return;
    const model = kind === 'document' ? documentAfterEdit(draft, documentModel, { title, documentType }) : null;
    if (kind === 'document' && !model) { setNotice('Баримтын бүтэц баталгаажсангүй. Засварыг export хийхгүй; текст дэлгэц дээр хэвээр байна.'); return; }
    if (model) setDocumentModel(model);
    const next = model ? updateEntryDocument(loadWorkspace().state, draftEntryId, draft.trim(), model) : updateEntryContent(loadWorkspace().state, draftEntryId, draft.trim());
    if (saveWorkspace(next)) { backgroundWorkspaceSync.schedule(next); setNotice('Зассан ноорог Workspace-д хадгалагдлаа.'); }
  };

  const exportDocx = async () => {
    const model = documentAfterEdit(draft, documentModel, { title, documentType });
    if (!model || exporting) { if (!model) setNotice('DOCX үүсгэхийн өмнө баримтын агуулгыг шалгана уу.'); return; }
    setExporting(true); setError('');
    try {
      setDocumentModel(model);
      if (draftEntryId) {
        const next = updateEntryDocument(loadWorkspace().state, draftEntryId, draft, model);
        if (saveWorkspace(next)) backgroundWorkspaceSync.schedule(next);
      }
      const { downloadDocx } = await import('../document-docx'); const filename = await downloadDocx(model);
      setNotice(`${filename} файл бэлэн боллоо.`);
    } catch { setError('DOCX файл үүсгэж чадсангүй. Ноорог Workspace-д хэвээр байна; дахин оролдоно уу.'); }
    finally { setExporting(false); }
  };

  const copy = async () => {
    try {
      if (!globalThis.navigator?.clipboard) throw new Error('Clipboard unavailable');
      await globalThis.navigator.clipboard.writeText(draft);
      setNotice('Ноорог clipboard-д хуулагдлаа.');
    } catch { setNotice('Автоматаар хуулах боломжгүй. Текстээ сонгож хуулна уу.'); }
  };

  const seo = {
    text: ['ENKH Текст боловсруулах', 'Текст засах, богиносгох, дэлгэрүүлэх, хураангуйлах, орчуулах болон албан хэлбэрт оруулах AI хэрэгсэл.', '/action-text'],
    message: ['ENKH Мессеж бэлтгэх', 'Зорилго, нөхцөл болон өнгө аяст тохирсон засварлах боломжтой мессежийн ноорог бэлтгэнэ.', '/action-message'],
    document: ['ENKH Баримт бичиг бэлтгэх', 'Монгол хэл дээр бүтэцтэй, засварлах боломжтой баримт бичиг бэлтгэж, бодит DOCX файл татна.', '/action-document'],
  }[kind];

  return <SafeAreaView style={styles.page}><SeoHead title={seo[0]} description={seo[1]} path={seo[2]} /><AppHeader active="tools"/><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={styles.title}>{labels[0]}</Text><Text style={styles.subtitle}>{labels[1]}</Text>
    <View style={styles.card}>
      {kind === 'text' && <><Text style={styles.label}>Үйлдэл</Text><Chips items={textOperations} value={operation} onChange={setOperation}/><Field label="Боловсруулах текст" value={text} onChange={setText} large/>{operation === 'translate' && <Field label="Орчуулах хэл" value={targetLanguage} onChange={setTargetLanguage}/>}<Field label="Нэмэлт чиглэл (заавал биш)" value={instructions} onChange={setInstructions}/></>}
      {kind === 'message' && <><Text style={styles.label}>Өнгө аяс</Text><Chips items={tones} value={tone} onChange={setTone}/><Field label="Хүлээн авагч (заавал биш)" value={recipient} onChange={setRecipient}/><Field label="Мессежийн зорилго" value={intent} onChange={setIntent} large/><Field label="Нөхцөл, дэлгэрэнгүй" value={context} onChange={setContext} large/></>}
      {kind === 'document' && <><Text style={styles.label}>Баримтын төрөл</Text><Chips items={documentTypes} value={documentType} onChange={setDocumentType}/><Field label="Гарчиг (заавал биш)" value={title} onChange={setTitle}/><Field label="Зорилго" value={purpose} onChange={setPurpose} large/><Field label="Агуулга, нөхцөл" value={context} onChange={setContext} large/></>}
      <Pressable accessibilityRole="button" disabled={!valid || loading} onPress={() => void generate()} style={[styles.primary, (!valid || loading) && styles.disabled]}>{loading ? <><ActivityIndicator color="#FFF"/><Text style={styles.loadingText}>Үүсгэж байна…</Text></> : <Text style={styles.primaryText}>{draft ? 'Дахин үүсгэх' : 'Үүсгэх'}</Text>}</Pressable>
      {!!error && <View accessibilityLiveRegion="polite" style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void generate()} style={styles.retry}><Text style={styles.retryText}>Дахин оролдох</Text></Pressable></View>}
    </View>
    {!!draft && <View style={styles.result}><View style={styles.resultHeader}><View><Text style={styles.label}>БЭЛЭН НООРОГ</Text>{kind === 'message' && <Text style={styles.safeNote}>Автоматаар илгээгдээгүй.</Text>}{kind === 'document' && <Text style={styles.safeNote}>Засварласан агуулгаас бодит Word файл үүснэ.</Text>}</View><View style={styles.resultActions}><Pressable accessibilityRole="button" onPress={() => void copy()} style={styles.copy}><Text style={styles.copyText}>Хуулах</Text></Pressable>{kind === 'document' && <Pressable accessibilityRole="button" disabled={exporting} onPress={() => void exportDocx()} style={[styles.exportButton, exporting && styles.disabled]}><Text style={styles.exportText}>{exporting ? 'Үүсгэж байна…' : 'DOCX татах'}</Text></Pressable>}</View></View><TextInput accessibilityLabel="Засварлах ноорог" multiline value={draft} onChangeText={setDraft} onBlur={saveEdit} style={styles.draft}/>{!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}</View>}
  </ScrollView></SafeAreaView>;
}

function Chips({ items, value, onChange }: { items: readonly (readonly [string,string])[]; value: string; onChange(value:string):void }) {
  return <View style={styles.chips}>{items.map(([id,label])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:value===id}} onPress={()=>onChange(id)} style={[styles.chip,value===id&&styles.chipActive]}><Text style={[styles.chipText,value===id&&styles.chipTextActive]}>{label}</Text></Pressable>)}</View>;
}
function Field({ label, value, onChange, large=false }: { label:string; value:string; onChange(value:string):void; large?:boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} multiline={large} value={value} onChangeText={onChange} style={[styles.input,large&&styles.large]} placeholder="Мэдээллээ оруулна уу…" placeholderTextColor="#829AB1"/></View>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:920,alignSelf:'center',padding:24,paddingBottom:60},title:{fontSize:36,fontWeight:'900',color:'#102A43'},subtitle:{marginTop:8,fontSize:15,lineHeight:23,color:'#627D98'},card:{marginTop:24,padding:22,gap:14,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},label:{fontSize:11,fontWeight:'900',letterSpacing:1.1,color:'#627D98'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:13,borderRadius:12,backgroundColor:'#EEF4FB'},chipActive:{backgroundColor:'#0B57D0'},chipText:{fontSize:13,fontWeight:'800',color:'#486581'},chipTextActive:{color:'#FFF'},field:{gap:7},input:{minHeight:48,padding:13,borderRadius:13,borderWidth:1,borderColor:'#D7E4F3',backgroundColor:'#F9FBFE',fontSize:15,color:'#102A43'},large:{minHeight:120,textAlignVertical:'top'},primary:{minHeight:50,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#0B57D0'},primaryText:{color:'#FFF',fontWeight:'900'},loadingText:{color:'#FFF',fontWeight:'800'},disabled:{opacity:.35},error:{padding:14,borderRadius:13,backgroundColor:'#FFF1EE'},errorText:{color:'#8B2C20',lineHeight:20},retry:{alignSelf:'flex-start',marginTop:10,minHeight:44,justifyContent:'center'},retryText:{color:'#8B2C20',fontWeight:'900'},result:{marginTop:18,padding:22,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#D7E4F3'},resultHeader:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',alignItems:'flex-start',gap:12},resultActions:{flexDirection:'row',flexWrap:'wrap',gap:8},safeNote:{marginTop:6,fontSize:12,color:'#627D98'},copy:{minHeight:44,justifyContent:'center',paddingHorizontal:15,borderRadius:12,backgroundColor:'#EAF2FF'},copyText:{color:'#0B57D0',fontWeight:'900'},exportButton:{minHeight:44,justifyContent:'center',paddingHorizontal:15,borderRadius:12,backgroundColor:'#0B57D0'},exportText:{color:'#FFF',fontWeight:'900'},draft:{marginTop:16,minHeight:240,padding:16,borderRadius:14,backgroundColor:'#F7FAFD',fontSize:16,lineHeight:25,color:'#243B53',textAlignVertical:'top'},notice:{marginTop:12,color:'#26713A',fontWeight:'700'}});
