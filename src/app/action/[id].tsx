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
import { router, useLocalSearchParams } from 'expo-router';

import {
  ACTIONS,
  ActionExecutionData,
  ActionId,
} from '../../action-engine';
import { runAction } from '../../api';

export function generateStaticParams() {
  return ACTIONS.map((action) => ({ id: action.id }));
}

export default function ActionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const actionId = (id || 'custom') as ActionId;

  const action = ACTIONS.find(
    (item) => item.id === actionId
  );

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);
  const [executionData, setExecutionData] =
    useState<ActionExecutionData | null>(null);

  const handleRun = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setLoading(true);
    setResult('');
    setSuccess(null);
    setExecutionData(null);

    try {
      const response = await runAction(actionId, text);

      setResult(
        response?.message ||
          'Action амжилттай ажиллалаа.'
      );

      setSuccess(response?.success !== false);

      if (
        response?.data &&
        typeof response.data === 'object'
      ) {
        const data =
          response.data as Partial<ActionExecutionData>;

        if (
          data.actionId &&
          data.input &&
          data.title &&
          data.executedAt
        ) {
          setExecutionData(
            data as ActionExecutionData
          );
        }
      }
    } catch {
      setResult(
        'ENKH Action API одоогоор холбогдох боломжгүй байна. Сервер холбогдсоны дараа энэ үйлдэл бодитоор ажиллана.'
      );

      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const useExample = (example: string) => {
    setInput(example);
    setResult('');
    setSuccess(null);
    setExecutionData(null);
  };

  if (!action) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>

          <Text style={styles.errorTitle}>
            Action олдсонгүй
          </Text>

          <Text style={styles.errorDescription}>
            Сонгосон Action бүртгэлгүй байна.
          </Text>

          <Pressable
            style={styles.backAction}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>
              Буцах
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const calculation = executionData?.result;

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
              ACTION
            </Text>

            <Text style={styles.headerStatus}>
              ENKH AI
            </Text>
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
              <Text style={styles.heroIcon}>
                {action.icon}
              </Text>
            </View>

            <Text style={styles.title}>
              {action.title}
            </Text>

            <Text style={styles.subtitle}>
              {action.description}
            </Text>
          </View>

          <View style={styles.card}>

            <View style={styles.sectionHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  1
                </Text>
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.label}>
                  {action.inputLabel}
                </Text>

                <Text style={styles.sectionDescription}>
                  ENKH-д хийх ажлын мэдээллийг өгнө үү.
                </Text>
              </View>
            </View>

            <TextInput
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setResult('');
                setSuccess(null);
                setExecutionData(null);
              }}
              placeholder={action.placeholder}
              placeholderTextColor="#999999"
              style={styles.input}
              multiline
              textAlignVertical="top"
              editable={!loading}
            />

            <Text style={styles.exampleTitle}>
              Жишээ
            </Text>

            <View style={styles.examples}>
              {action.examples.map((example) => (
                <Pressable
                  key={example}
                  style={styles.exampleChip}
                  onPress={() => useExample(example)}
                  disabled={loading}
                >
                  <Text style={styles.exampleText}>
                    {example}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.executeHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  2
                </Text>
              </View>

              <View>
                <Text style={styles.label}>
                  Гүйцэтгэх
                </Text>

                <Text style={styles.sectionDescription}>
                  ENKH-д даалгаврыг ажиллуулна.
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.runButton,
                (!input.trim() || loading) &&
                  styles.runButtonDisabled,
              ]}
              onPress={handleRun}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />

                  <Text style={styles.runButtonText}>
                    ENKH ажиллаж байна...
                  </Text>
                </>
              ) : (
                <Text style={styles.runButtonText}>
                  ⚡ ENKH-д ажиллуулах
                </Text>
              )}
            </Pressable>

            {result !== '' && (
              <View
                style={[
                  styles.resultCard,
                  success === false
                    ? styles.resultCardError
                    : styles.resultCardSuccess,
                ]}
              >
                <Text style={styles.resultIcon}>
                  {success === false ? '⚠️' : '✓'}
                </Text>

                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>
                    {success === false
                      ? 'Ажиллуулахад асуудал гарлаа'
                      : 'ENKH-ийн хариу'}
                  </Text>

                  <Text style={styles.resultText}>
                    {result}
                  </Text>
                </View>
              </View>
            )}

            {calculation?.type === 'calculation' && (
              <View style={styles.calculationCard}>

                <View style={styles.calculationHeader}>
                  <View style={styles.calculationIcon}>
                    <Text style={styles.calculationIconText}>
                      🧮
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.calculationTitle}>
                      Тооцооллын үр дүн
                    </Text>

                    <Text style={styles.calculationSubtitle}>
                      ENKH Action Engine
                    </Text>
                  </View>
                </View>

                <View style={styles.calculationRows}>

                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>
                      Үндсэн хэмжээ
                    </Text>

                    <Text style={styles.calculationValue}>
                      {calculation.baseValue} {calculation.unit}
                    </Text>
                  </View>

                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>
                      Илүүдэл
                    </Text>

                    <Text style={styles.calculationValue}>
                      {calculation.extraPercent}%
                    </Text>
                  </View>

                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>
                      Илүүдлийн хэмжээ
                    </Text>

                    <Text style={styles.calculationValue}>
                      {calculation.extraValue.toFixed(2)}{' '}
                      {calculation.unit}
                    </Text>
                  </View>

                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>
                    Нийт хэрэгцээ
                  </Text>

                  <Text style={styles.totalValue}>
                    {calculation.totalValue.toFixed(2)}{' '}
                    {calculation.unit}
                  </Text>
                </View>

              </View>
            )}

            {executionData && (
              <View style={styles.executionCard}>

                <Text style={styles.executionTitle}>
                  Гүйцэтгэлийн мэдээлэл
                </Text>

                <View style={styles.executionRow}>
                  <Text style={styles.executionLabel}>
                    Action
                  </Text>

                  <Text style={styles.executionValue}>
                    {executionData.title}
                  </Text>
                </View>

                <View style={styles.executionRow}>
                  <Text style={styles.executionLabel}>
                    Input
                  </Text>

                  <Text style={styles.executionValue}>
                    {executionData.input}
                  </Text>
                </View>

                <View style={styles.executionRow}>
                  <Text style={styles.executionLabel}>
                    Executed
                  </Text>

                  <Text style={styles.executionValue}>
                    {new Date(
                      executionData.executedAt
                    ).toLocaleString()}
                  </Text>
                </View>

              </View>
            )}

          </View>

          <View style={styles.engineCard}>

            <View style={styles.engineHeader}>
              <View style={styles.engineIcon}>
                <Text style={styles.engineIconText}>
                  ⚡
                </Text>
              </View>

              <View>
                <Text style={styles.infoTitle}>
                  ENKH Action Engine
                </Text>

                <Text style={styles.engineStatus}>
                  READY
                </Text>
              </View>
            </View>

            <Text style={styles.infoText}>
              Таны даалгавар ENKH-ийн Action Engine
              рүү дамжиж, тохирох үйлдлээр
              боловсруулагдана.
            </Text>

            <View style={styles.flow}>

              <View style={styles.flowItem}>
                <Text style={styles.flowNumber}>
                  01
                </Text>

                <Text style={styles.flowTitle}>
                  Input
                </Text>
              </View>

              <Text style={styles.flowArrow}>
                →
              </Text>

              <View style={styles.flowItem}>
                <Text style={styles.flowNumber}>
                  02
                </Text>

                <Text style={styles.flowTitle}>
                  Execute
                </Text>
              </View>

              <Text style={styles.flowArrow}>
                →
              </Text>

              <View style={styles.flowItem}>
                <Text style={styles.flowNumber}>
                  03
                </Text>

                <Text style={styles.flowTitle}>
                  Result
                </Text>
              </View>

            </View>

          </View>

        </ScrollView>

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

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 38,
    paddingBottom: 30,
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

  card: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 22,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  sectionHeaderText: {
    flex: 1,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  sectionDescription: {
    marginTop: 3,
    fontSize: 12,
    color: '#888888',
  },

  input: {
    minHeight: 170,
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

  exampleTitle: {
    marginTop: 18,
    marginBottom: 9,
    fontSize: 12,
    fontWeight: '700',
    color: '#777777',
  },

  examples: {
    gap: 8,
  },

  exampleChip: {
    borderRadius: 13,
    backgroundColor: '#F7F7F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  exampleText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#555555',
  },

  stepDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 22,
  },

  executeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  runButton: {
    height: 56,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },

  resultCardSuccess: {
    backgroundColor: '#F3F3F1',
  },

  resultCardError: {
    backgroundColor: '#F5F5F5',
  },

  resultIcon: {
    fontSize: 20,
  },

  resultContent: {
    flex: 1,
  },

  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 5,
  },

  resultText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555555',
  },

  calculationCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 18,
  },

  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  calculationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  calculationIconText: {
    fontSize: 21,
  },

  calculationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222222',
  },

  calculationSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: '#999999',
  },

  calculationRows: {
    marginTop: 16,
  },

  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#EAEAE7',
  },

  calculationLabel: {
    fontSize: 13,
    color: '#777777',
  },

  calculationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },

  totalBox: {
    marginTop: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  executionCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#E8E8E5',
  },

  executionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 12,
  },

  executionRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  executionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 3,
  },

  executionValue: {
    fontSize: 13,
    lineHeight: 19,
    color: '#444444',
  },

  engineCard: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  engineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  engineIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  engineIconText: {
    fontSize: 20,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  engineStatus: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#999999',
  },

  infoText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
  },

  flow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  flowItem: {
    alignItems: 'center',
    minWidth: 72,
  },

  flowNumber: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#AAAAAA',
  },

  flowTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },

  flowArrow: {
    fontSize: 18,
    color: '#AAAAAA',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#AAAAAA',
    paddingVertical: 14,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorIcon: {
    fontSize: 36,
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },

  errorDescription: {
    marginTop: 8,
    fontSize: 15,
    color: '#777777',
    textAlign: 'center',
  },

  backAction: {
    marginTop: 24,
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 15,
  },

  backActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
