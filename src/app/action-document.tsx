import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ACTIONS, ActionId } from '../action-engine';

export default function ActionsScreen() {
  const openAction = (actionId: ActionId) => {
    switch (actionId) {
      case 'message':
        router.push('/action-message');
        break;

      case 'reminder':
        router.push('/action-reminder');
        break;

      case 'document':
        router.push('/action-document');
        break;

      default:
        break;
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
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              ACTIONS
            </Text>

            <Text style={styles.headerStatus}>
              ENKH AI
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Text style={styles.heroIcon}>⚡</Text>
          </View>

          <Text style={styles.title}>
            ENKH Actions
          </Text>

          <Text style={styles.subtitle}>
            Энхээр ажиллуулах боломжууд
          </Text>
        </View>

        <View style={styles.actionList}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.actionCard}
              onPress={() => openAction(action.id)}
            >
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIcon}>
                  {action.icon}
                </Text>
              </View>

              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>
                  {action.title}
                </Text>

                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </View>

              <Text style={styles.arrow}>
                →
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>
          ENKH AI · Action Engine
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
    paddingVertical: 38,
  },

  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  heroIcon: {
    fontSize: 36,
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

  actionList: {
    gap: 12,
  },

  actionCard: {
    minHeight: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIcon: {
    fontSize: 25,
  },

  actionInfo: {
    flex: 1,
    marginLeft: 16,
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

  arrow: {
    fontSize: 22,
    color: '#777777',
    marginLeft: 12,
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 20,
  },
});