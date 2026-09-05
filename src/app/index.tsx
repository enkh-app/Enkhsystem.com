import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>ENKH</Text>
            <Text style={styles.status}>AI ASSISTANT</Text>
          </View>

          <Pressable style={styles.settings}>
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>E</Text>
          </View>

          <Text style={styles.greeting}>
            Сайн байна уу, Nasa.
          </Text>

          <Text style={styles.subtitle}>
            Өнөөдөр юугаар туслах вэ?
          </Text>
        </View>

        <Pressable
          style={styles.chatInput}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.placeholder}>
            Энхээс юм асуух...
          </Text>

          <Text style={styles.mic}>🎙</Text>
        </Pressable>

        <View style={styles.actions}>

          {/* Chat */}
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.actionIcon}>💬</Text>

            <Text style={styles.actionTitle}>
              Chat
            </Text>

            <Text style={styles.actionDescription}>
              Энхтэй ярилцах
            </Text>
          </Pressable>

          {/* Knowledge */}
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/knowledge')}
          >
            <Text style={styles.actionIcon}>🧠</Text>

            <Text style={styles.actionTitle}>
              Knowledge
            </Text>

            <Text style={styles.actionDescription}>
              Мэдлэг хайх
            </Text>
          </Pressable>

          {/* Actions */}
          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/actions')}
          >
            <Text style={styles.actionIcon}>⚡</Text>

            <Text style={styles.actionTitle}>
              Actions
            </Text>

            <Text style={styles.actionDescription}>
              Ажиллуулах
            </Text>
          </Pressable>

          {/* Business */}
          <Pressable
            style={styles.actionCard}
            onPress={() => {}}
          >
            <Text style={styles.actionIcon}>📊</Text>

            <Text style={styles.actionTitle}>
              Business
            </Text>

            <Text style={styles.actionDescription}>
              Бизнес удирдах
            </Text>
          </Pressable>

        </View>

        <Text style={styles.footer}>
          ENKH AI · Your intelligent partner
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#111111',
  },

  status: {
    marginTop: 3,
    fontSize: 9,
    letterSpacing: 2,
    color: '#888888',
  },

  settings: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsText: {
    fontSize: 20,
    color: '#333333',
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
  },

  greeting: {
    fontSize: 38,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 19,
    color: '#777777',
    textAlign: 'center',
  },

  chatInput: {
    minHeight: 68,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 18,
  },

  placeholder: {
    flex: 1,
    fontSize: 16,
    color: '#888888',
  },

  mic: {
    fontSize: 21,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  actionCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  actionIcon: {
    fontSize: 24,
    marginBottom: 14,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  actionDescription: {
    marginTop: 5,
    fontSize: 13,
    color: '#888888',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 20,
  },
});