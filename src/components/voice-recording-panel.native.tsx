import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';

const MAX_SECONDS = 260;
const MAX_BYTES = 10_000_000;

export function VoiceRecordingPanel() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<'idle' | 'starting' | 'recording' | 'stopping' | 'ready'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState('');
  const [readyUri, setReadyUri] = useState<string | null>(null);
  const active = useRef(false);
  const startedAt = useRef(0);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileUri = useRef<string | null>(null);
  const mounted = useRef(true);

  const clearTimers = () => {
    if (timer.current) clearInterval(timer.current);
    if (timeout.current) clearTimeout(timeout.current);
    timer.current = null; timeout.current = null;
  };
  const removeFile = (uri: string | null) => {
    if (!uri) return;
    try { const file = new File(uri); if (file.exists) file.delete(); }
    catch { /* Cache cleanup is best effort. */ }
  };

  const stop = async () => {
    if (!active.current || busy.current) return;
    busy.current = true; clearTimers(); setPhase('stopping');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('RECORDING_UNAVAILABLE');
      if (!mounted.current) { removeFile(uri); return; }
      fileUri.current = uri;
      const file = new File(uri);
      if (!file.exists || !file.size || file.size > MAX_BYTES) {
        removeFile(uri); fileUri.current = null;
        setNotice('Бичлэг 10 МБ-аас их эсвэл хоосон байна. Богиносгоод дахин оролдоно уу.');
        setPhase('idle');
      } else {
        setSeconds(Math.min(MAX_SECONDS, Math.ceil((Date.now() - startedAt.current) / 1000)));
        setReadyUri(uri); setPhase('ready');
        setNotice('Бичлэг бэлэн. Дуу таних сервер холбогдсоны дараа бичвэр болгох боломжтой.');
      }
    } catch {
      setNotice('Бичлэгийг хадгалж чадсангүй. Дахин оролдоно уу.'); setPhase('idle');
    } finally {
      active.current = false; busy.current = false;
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  };

  const start = async () => {
    if (busy.current || active.current) return;
    busy.current = true; setPhase('starting'); setNotice('');
    removeFile(fileUri.current); fileUri.current = null; setReadyUri(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setNotice('Микрофоны зөвшөөрлийг утасны Settings хэсгээс нээнэ үү.'); setPhase('idle'); return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      active.current = true; startedAt.current = Date.now(); setSeconds(0); setPhase('recording');
      timer.current = setInterval(() => setSeconds(Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAt.current) / 1000))), 1000);
      timeout.current = setTimeout(() => { void stop(); }, MAX_SECONDS * 1000);
    } catch {
      setNotice('Дуу бичлэгийг эхлүүлж чадсангүй.'); setPhase('idle');
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    } finally { busy.current = false; }
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
    mounted.current = false;
    clearTimers();
    if (active.current && !busy.current) void recorder.stop().then(() => removeFile(recorder.uri)).catch(() => {});
    void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    removeFile(fileUri.current);
    };
  }, [recorder]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void stop();
    });
    return () => subscription.remove();
  }, [phase]);

  const discard = () => {
    removeFile(fileUri.current); fileUri.current = null; setReadyUri(null); setSeconds(0); setNotice(''); setPhase('idle');
  };

  return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Ярих горим</Text>
    <Text style={styles.help}>{phase === 'recording' ? `Бичиж байна · ${seconds}/${MAX_SECONDS} сек` :
      phase === 'ready' ? `Бичлэг бэлэн · ${seconds} сек` : '260 секунд хүртэл дуу бичиж болно.'}</Text>
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    {phase === 'recording' || phase === 'ready' ? <Text style={styles.notice}>Горим солиход бичлэг устна.</Text> : null}
    <View style={styles.actions}>
      {phase === 'recording' ? <Pressable accessibilityRole="button" accessibilityLabel="Бичлэгийг зогсоох"
        onPress={() => void stop()} style={styles.button}><Text style={styles.buttonText}>■ Зогсоох</Text></Pressable> : null}
      {phase === 'idle' || phase === 'ready' ? <Pressable accessibilityRole="button"
        accessibilityLabel={phase === 'ready' ? 'Шинээр дуу бичих' : 'Дуу бичиж эхлэх'}
        onPress={() => void start()} style={styles.button}><Text style={styles.buttonText}>● {phase === 'ready' ? 'Шинээр бичих' : 'Бичих'}</Text></Pressable> : null}
      {readyUri && phase === 'ready' ? <Pressable accessibilityRole="button" accessibilityLabel="Бичлэгийг устгах"
        onPress={discard} style={styles.secondary}><Text style={styles.secondaryText}>Устгах</Text></Pressable> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { flex: 1, paddingHorizontal: 7, paddingVertical: 3, gap: 3 },
  title: { color: '#102A43', fontSize: 14, fontWeight: '700' },
  help: { color: '#627D98', fontSize: 11 },
  notice: { color: '#627D98', fontSize: 11, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 7, paddingTop: 3 },
  button: { borderRadius: 9, backgroundColor: '#0B57D0', paddingHorizontal: 12, paddingVertical: 9 },
  buttonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  secondary: { borderRadius: 9, backgroundColor: '#F1F5FA', paddingHorizontal: 12, paddingVertical: 9 },
  secondaryText: { color: '#486581', fontSize: 12, fontWeight: '700' },
});
