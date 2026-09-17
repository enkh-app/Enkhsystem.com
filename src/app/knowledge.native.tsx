import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchWeb, SearchSource } from '../api';
import { AppHeader } from '../components/app-header';
import { useI18n } from '../i18n';

type RecentKnowledge = { query: string; answer: string; sources: SearchSource[] };

export default function NativeKnowledgeScreen() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<RecentKnowledge[]>([]);
  const [selected, setSelected] = useState<RecentKnowledge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    const value = query.trim();
    if (!value || value.length > 1000 || loading) return;
    setLoading(true); setError('');
    try {
      const response = await searchWeb(value);
      const result = response.data?.result;
      if (!result?.answer?.trim()) throw new Error('SEARCH_EMPTY');
      const entry = { query: value, answer: result.answer.trim(),
        sources: (result.sources || []).filter((source) => /^https?:\/\//i.test(source.url)) };
      setSelected(entry);
      setRecent((current) => [entry, ...current.filter((item) => item.query !== value)].slice(0, 5));
    } catch { setError(t('search.networkError')); }
    finally { setLoading(false); }
  };

  return <SafeAreaView edges={['top']} style={styles.page}>
    <AppHeader active="search" />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>Knowledge</Text>
      <Text style={styles.subtitle}>Асуултаа хайж, эх сурвалжтай хариу аваарай.</Text>
      <View style={styles.searchBox}>
        <TextInput value={query} onChangeText={setQuery} editable={!loading} returnKeyType="search"
          onSubmitEditing={() => void search()} accessibilityLabel={t('search.placeholder')}
          placeholder={t('search.placeholder')} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('search.button')}
          disabled={!query.trim() || loading} onPress={() => void search()} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>⌕</Text>
        </Pressable>
      </View>
      {loading && <View style={styles.state}><ActivityIndicator color="#0B57D0" /><Text>{t('search.loading')}</Text></View>}
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
      {selected && <View style={styles.answerCard}>
        <Text style={styles.answerLabel}>{t('search.answer')}</Text>
        <Text style={styles.answer}>{selected.answer}</Text>
        {selected.sources.map((source) => <Pressable key={source.url} accessibilityRole="link"
          onPress={() => void Linking.openURL(source.url)} style={styles.source}>
          <Text numberOfLines={2} style={styles.sourceText}>{source.title || source.url}</Text>
        </Pressable>)}
      </View>}
      <Text accessibilityRole="header" style={styles.section}>Сүүлийн хайлт · энэ удаа</Text>
      {recent.length ? recent.map((item) => <Pressable key={item.query} accessibilityRole="button"
        onPress={() => { setQuery(item.query); setSelected(item); }} style={styles.recent}>
        <Text numberOfLines={1} style={styles.recentText}>{item.query}</Text><Text style={styles.recentArrow}>›</Text>
      </Pressable>) : <Text style={styles.empty}>Хайлт хийсний дараа энд харагдана.</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 32 },
  title: { color: '#102A43', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 5, color: '#627D98', fontSize: 14, lineHeight: 21 },
  searchBox: { marginTop: 22, backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1,
    borderColor: '#DFEAF7', paddingLeft: 14, paddingRight: 5, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 52, fontSize: 15, color: '#102A43' },
  searchButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: '#0B57D0' }, searchButtonText: { color: '#FFFFFF', fontSize: 24 },
  state: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  error: { marginTop: 15, color: '#94423A' },
  answerCard: { marginTop: 20, padding: 17, borderRadius: 18, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#DFEAF7' },
  answerLabel: { color: '#0B57D0', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  answer: { marginTop: 10, color: '#102A43', fontSize: 15, lineHeight: 23 },
  source: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#E7EEF7' },
  sourceText: { color: '#0B57D0', fontSize: 13 },
  section: { marginTop: 26, marginBottom: 10, color: '#102A43', fontSize: 17, fontWeight: '900' },
  recent: { minHeight: 52, borderRadius: 13, marginBottom: 7, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  recentText: { flex: 1, color: '#243B53', fontSize: 14 }, recentArrow: { color: '#0B57D0', fontSize: 24 },
  empty: { color: '#829AB1', fontSize: 13 },
});
