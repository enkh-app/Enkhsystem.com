import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { sendMessage, ChatMessage } from '../api';

type Message = {
  id: number;
  text: string;
  from: 'user' | 'enkh';
};

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Ð¡Ð°Ð¹Ð½ Ð±Ð°Ð¹Ð½Ð° ÑƒÑƒ, Nasa. Ð‘Ð¸ Ð­Ð½Ñ… Ð±Ð°Ð¹Ð½Ð°. Ð®ÑƒÐ³Ð°Ð°Ñ€ Ñ‚ÑƒÑÐ»Ð°Ñ… Ð²Ñ?',
      from: 'enkh',
    },
  ]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages]);

  const sendChatMessage = async () => {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      from: 'user',
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((message) => ({
        role: message.from === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

      const data = await sendMessage(text, history);

      const assistantText =
        data?.message ??
        data?.response ??
        data?.answer ??
        data?.content ??
        'Ð­Ð½Ñ…ÑÑÑ Ñ…Ð°Ñ€Ð¸Ñƒ Ð¸Ñ€ÑÑÐ½ Ð±Ð¾Ð»Ð¾Ð²Ñ‡ Ñ…Ð°Ñ€Ð¸ÑƒÐ½Ñ‹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ Ñ‚Ð¾Ð´Ð¾Ñ€Ñ…Ð¾Ð¹Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°.';

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          text: assistantText,
          from: 'enkh',
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          text: 'ENKH API Ð¾Ð´Ð¾Ð¾Ð³Ð¾Ð¾Ñ€ Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°. API ÑÐµÑ€Ð²ÐµÑ€ÑÑ Ð°Ð¶Ð¸Ð»Ð»ÑƒÑƒÐ»ÑÐ½Ñ‹ Ð´Ð°Ñ€Ð°Ð° ÑÐ½Ð´ÑÑÑ ÑˆÑƒÑƒÐ´ Ñ…Ð°Ñ€Ð¸Ñƒ Ð°Ð²Ð½Ð°.',
          from: 'enkh',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>â€¹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ENKH</Text>
            <Text style={styles.headerStatus}>
              AI ASSISTANT
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.from === 'user'
                  ? styles.userRow
                  : styles.enkhRow,
              ]}
            >
              {message.from === 'enkh' && (
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>E</Text>
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  message.from === 'user'
                    ? styles.userBubble
                    : styles.enkhBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.from === 'user'
                      ? styles.userMessageText
                      : styles.enkhMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.loadingRow}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>E</Text>
              </View>

              <View style={styles.loadingBubble}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>
                  Ð­Ð½Ñ… Ð±Ð¾Ð´Ð¾Ð¶ Ð±Ð°Ð¹Ð½Ð°...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ð­Ð½Ñ…ÑÑÑ ÑŽÐ¼ Ð°ÑÑƒÑƒÑ…..."
              placeholderTextColor="#999999"
              style={styles.input}
              multiline
              editable={!loading}
            />

            <Pressable style={styles.voiceButton}>
              <Text style={styles.voiceIcon}>ðŸŽ™</Text>
            </Pressable>

            <Pressable
              style={[
                styles.sendButton,
                (!input.trim() || loading) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={sendChatMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendIcon}>â†‘</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  keyboard: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 4,
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

  messages: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    gap: 22,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    maxWidth: '85%',
  },

  enkhRow: {
    alignSelf: 'flex-start',
  },

  userRow: {
    alignSelf: 'flex-end',
  },

  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },

  enkhBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    backgroundColor: '#111111',
    borderBottomRightRadius: 5,
  },

  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },

  enkhMessageText: {
    color: '#222222',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    alignSelf: 'flex-start',
  },

  loadingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    color: '#777777',
  },

  inputArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },

  inputWrapper: {
    minHeight: 64,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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

  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  voiceIcon: {
    fontSize: 20,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.25,
  },

  sendIcon: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },
});
