import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { searchKnowledge, KnowledgeResult } from '../api';

export default function KnowledgeSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const text = query.trim();

    if (!text || loading) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const data = await searchKnowledge(text);
      setResults(data);
    } catch (error) {
      setError(
        'Knowledge API Ð¾Ð´Ð¾Ð¾Ð³Ð¾Ð¾Ñ€ Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°. ÐœÑÐ´Ð»ÑÐ³Ð¸Ð¹Ð½ ÑÐµÑ€Ð²ÐµÑ€ÑÑ Ð°Ð¶Ð¸Ð»Ð»ÑƒÑƒÐ»ÑÐ½Ñ‹ Ð´Ð°Ñ€Ð°Ð° ÑÐ½Ð´ Ð±Ð¾Ð´Ð¸Ñ‚ Ò¯Ñ€ Ð´Ò¯Ð½ Ð³Ð°Ñ€Ð½Ð°.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>â€¹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>KNOWLEDGE SEARCH</Text>
            <Text style={styles.headerStatus}>ENKH AI</Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>ðŸ”Ž</Text>
            </View>

            <Text style={styles.title}>
              ÐœÑÐ´Ð»ÑÐ³ Ñ…Ð°Ð¹Ñ…
            </Text>

            <Text style={styles.subtitle}>
              ENKH-Ð¸Ð¹Ð½ Ð¼ÑÐ´Ð»ÑÐ³Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ Ð¼ÑÐ´ÑÑÐ»ÑÐ» Ñ…Ð°Ð¹
            </Text>
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ð®Ñƒ Ñ…Ð°Ð¹Ñ… Ð²Ñ?"
              placeholderTextColor="#999999"
              style={styles.input}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!loading}
            />

            <Pressable
              style={[
                styles.searchButton,
                loading && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.searchButtonText}>
                  Ð¥Ð°Ð¹Ñ…
                </Text>
              )}
            </Pressable>
          </View>

          {error !== '' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>âš ï¸</Text>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingState}>
              <ActivityIndicator />

              <Text style={styles.loadingText}>
                ÐœÑÐ´Ð»ÑÐ³Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð°Ð°Ñ Ñ…Ð°Ð¹Ð¶ Ð±Ð°Ð¹Ð½Ð°...
              </Text>
            </View>
          )}

          {!loading && !error && results.length > 0 && (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>
                Ð¥Ð°Ð¹Ð»Ñ‚Ñ‹Ð½ Ò¯Ñ€ Ð´Ò¯Ð½
              </Text>

              {results.map((result) => (
                <View
                  key={result.id}
                  style={styles.resultCard}
                >
                  <View style={styles.resultTop}>
                    <Text style={styles.resultIcon}>
                      ðŸ“„
                    </Text>

                    <View style={styles.resultCategory}>
                      <Text style={styles.categoryText}>
                        {result.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.resultTitle}>
                    {result.title}
                  </Text>

                  <Text style={styles.resultDescription}>
                    {result.description}
                  </Text>

                  <Pressable
                    style={styles.openButton}
                    onPress={() => {}}
                  >
                    <Text style={styles.openButtonText}>
                      ÐÑÑÑ… â†’
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {!loading &&
            !error &&
            results.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>ðŸ§ </Text>

                <Text style={styles.emptyTitle}>
                  Knowledge Search
                </Text>

                <Text style={styles.emptyDescription}>
                  ÐÑÑƒÑƒÐ»Ñ‚ ÑÑÐ²ÑÐ» Ñ‚Ò¯Ð»Ñ…Ò¯Ò¯Ñ€ Ò¯Ð³ Ð¾Ñ€ÑƒÑƒÐ»Ð°Ð°Ð´
                  Ñ…Ð°Ð¹Ð»Ñ‚ Ñ…Ð¸Ð¹Ð½Ñ Ò¯Ò¯.
                </Text>
              </View>
            )}
        </ScrollView>

        <Text style={styles.footer}>
          ENKH AI Â· Knowledge Search
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 18,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#111111',
  },

  headerCenter: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#111111',
  },

  headerStatus: {
    marginTop: 3,
    fontSize: 8,
    letterSpacing: 2,
    color: '#999999',
  },

  headerPlaceholder: {
    width: 44,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 42,
    paddingBottom: 34,
  },

  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 32,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
  },

  searchWrapper: {
    minHeight: 66,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 14,
  },

  searchButton: {
    minWidth: 82,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  searchButtonDisabled: {
    opacity: 0.6,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777777',
  },

  errorCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
    alignItems: 'center',
  },

  errorIcon: {
    fontSize: 26,
    marginBottom: 10,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666666',
    textAlign: 'center',
  },

  results: {
    marginTop: 28,
    gap: 14,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 2,
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
  },

  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultIcon: {
    fontSize: 24,
  },

  resultCategory: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  categoryText: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '600',
  },

  resultTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },

  resultDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#777777',
  },

  openButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },

  openButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222222',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },

  emptyIcon: {
    fontSize: 34,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  emptyDescription: {
    marginTop: 7,
    maxWidth: 420,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: '#888888',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    paddingVertical: 14,
  },
});
