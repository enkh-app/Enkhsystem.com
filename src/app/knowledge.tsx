import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function KnowledgeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>KNOWLEDGE</Text>
            <Text style={styles.headerStatus}>ENKH AI</Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🧠</Text>
          </View>

          <Text style={styles.title}>
            ENKH Knowledge
          </Text>

          <Text style={styles.subtitle}>
            Энхийн мэдлэгийн сан
          </Text>
        </View>

        <View style={styles.cards}>

          {/* Мэдлэг хайх */}
          <Pressable
            style={styles.card}
            onPress={() => router.push('/knowledge-search')}
          >
            <Text style={styles.cardIcon}>📚</Text>

            <Text style={styles.cardTitle}>
              Мэдлэг хайх
            </Text>

            <Text style={styles.cardDescription}>
              Энхийн мэдлэгийн сангаас мэдээлэл хайх
            </Text>
          </Pressable>

          {/* Баримт бичиг */}
          <Pressable style={styles.card}>
            <Text style={styles.cardIcon}>📄</Text>

            <Text style={styles.cardTitle}>
              Баримт бичиг
            </Text>

            <Text style={styles.cardDescription}>
              Файл болон баримтуудаа мэдлэгийн санд ашиглах
            </Text>
          </Pressable>

          {/* Ангилал */}
          <Pressable style={styles.card}>
            <Text style={styles.cardIcon}>🗂️</Text>

            <Text style={styles.cardTitle}>
              Ангилал
            </Text>

            <Text style={styles.cardDescription}>
              Мэдлэгийг сэдэв болон төслөөр зохион байгуулах
            </Text>
          </Pressable>

          {/* Smart Search */}
          <Pressable
            style={styles.card}
            onPress={() => router.push('/knowledge-search')}
          >
            <Text style={styles.cardIcon}>🔎</Text>

            <Text style={styles.cardTitle}>
              Smart Search
            </Text>

            <Text style={styles.cardDescription}>
              Асуултаар холбогдох мэдээллийг ухаалгаар олох
            </Text>
          </Pressable>

        </View>

        <Text style={styles.footer}>
          ENKH AI · Knowledge System
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

  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  icon: {
    fontSize: 38,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 17,
    color: '#777777',
    textAlign: 'center',
  },

  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  card: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  cardIcon: {
    fontSize: 28,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },

  cardDescription: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#888888',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 22,
  },
});