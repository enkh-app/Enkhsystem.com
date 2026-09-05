import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { runAction } from '../api';

export default function ActionMessageScreen() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleRun = async () => {
    const text = message.trim();

    if (!text || loading) return;

    setLoading(true);
    setResult('');

    try {
      const data = await runAction('message', text);

      setResult(
        data?.message ||
          'Action Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ñ‚Ð°Ð¹ Ð°Ð¶Ð¸Ð»Ð»Ð°Ð»Ð°Ð°.'
      );
    } catch (error) {
      setResult(
        'ENKH Action API Ð¾Ð´Ð¾Ð¾Ð³Ð¾Ð¾Ñ€ Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°. Ð¡ÐµÑ€Ð²ÐµÑ€ Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´ÑÐ¾Ð½Ñ‹ Ð´Ð°Ñ€Ð°Ð° ÑÐ½Ñ Ò¯Ð¹Ð»Ð´ÑÐ» Ð±Ð¾Ð´Ð¸Ñ‚Ð¾Ð¾Ñ€ Ð°Ð¶Ð¸Ð»Ð»Ð°Ð½Ð°.'
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
            <Text style={styles.headerTitle}>
              MESSAGE ACTION
            </Text>

            <Text style={styles.headerStatus}>
              ENKH AI
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.body}>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>ðŸ’¬</Text>
          </View>

          <Text style={styles.title}>
            ÐœÐµÑÑÐµÐ¶ Ð¸Ð»Ð³ÑÑÑ…
          </Text>

          <Text style={styles.subtitle}>
            Ð­Ð½Ñ…ÑÑÑ€ Ð¼ÐµÑÑÐµÐ¶Ð¸Ð¹Ð½ Ò¯Ð¹Ð»Ð´ÑÐ» Ð°Ð¶Ð¸Ð»Ð»ÑƒÑƒÐ»Ð°Ñ…
          </Text>

          <View style={styles.card}>

            <Text style={styles.label}>
              ÐœÐµÑÑÐµÐ¶
            </Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Ð˜Ð»Ð³ÑÑÑ… Ð¼ÐµÑÑÐµÐ¶ÑÑ Ð±Ð¸Ñ‡Ð½Ñ Ò¯Ò¯..."
              placeholderTextColor="#999999"
              style={styles.input}
              multiline
              textAlignVertical="top"
              editable={!loading}
            />

            <Pressable
              style={[
                styles.runButton,
                (!message.trim() || loading) &&
                  styles.runButtonDisabled,
              ]}
              onPress={handleRun}
              disabled={!message.trim() || loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />

                  <Text style={styles.runButtonText}>
                    ÐÐ¶Ð¸Ð»Ð»ÑƒÑƒÐ»Ð¶ Ð±Ð°Ð¹Ð½Ð°...
                  </Text>
                </>
              ) : (
                <Text style={styles.runButtonText}>
                  âš¡ ÐÐ¶Ð¸Ð»Ð»ÑƒÑƒÐ»Ð°Ñ…
                </Text>
              )}
            </Pressable>

            {result !== '' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultIcon}>
                  {result.includes('Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹')
                    ? 'âš ï¸'
                    : 'âœ“'}
                </Text>

                <Text style={styles.resultText}>
                  {result}
                </Text>
              </View>
            )}

          </View>

        </View>

        <Text style={styles.footer}>
          ENKH AI Â· Message Action
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
    paddingVertical: 24,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.5,
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

  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 55,
  },

  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 35,
  },

  title: {
    marginTop: 20,
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

  card: {
    width: '100%',
    maxWidth: 700,
    marginTop: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },

  input: {
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: '#F7F7F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    lineHeight: 24,
    color: '#111111',
  },

  runButton: {
    height: 54,
    marginTop: 16,
    borderRadius: 17,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  runButtonDisabled: {
    opacity: 0.25,
  },

  runButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  resultCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F7F7F5',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  resultIcon: {
    fontSize: 20,
  },

  resultText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    paddingVertical: 14,
  },
});
