import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminApiError, AdminOverview, adminLoginUrl, getAdminOverview } from '../../api';
import { AppHeader } from '../../components/app-header';
import { SeoHead } from '../../components/seo-head';
import { TranslationKey, useI18n } from '../../i18n';

function Metric({ label, value }: { label: string; value: string | number }) {
  return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>;
}

function StatusCard({ label, status, tone = 'neutral' }: { label: string; status: string; tone?: 'positive' | 'neutral' | 'warning' }) {
  return <View style={s.statusCard}><Text style={s.statusLabel}>{label}</Text><View style={[s.badge, tone === 'positive' ? s.badgePositive : tone === 'warning' ? s.badgeWarning : s.badgeNeutral]}>
    <Text numberOfLines={1} ellipsizeMode="tail" style={[s.badgeText, tone === 'positive' ? s.badgeTextPositive : tone === 'warning' ? s.badgeTextWarning : s.badgeTextNeutral]}>{status}</Text>
  </View></View>;
}

function ManagementAction({ title, description, actionLabel, onPress, disabled = false }: { title: string; description: string; actionLabel: string; onPress?: () => void; disabled?: boolean }) {
  return <View style={s.managementCard}><View style={s.managementCopy}><Text style={s.managementTitle}>{title}</Text><Text style={s.managementDescription}>{description}</Text></View>
    <Pressable accessibilityRole="link" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.managementButton, disabled && s.managementButtonDisabled, pressed && !disabled && s.pressed]}>
      <Text style={[s.managementButtonText, disabled && s.managementButtonTextDisabled]}>{actionLabel}</Text>
    </Pressable></View>;
}

function databaseStatusKey(value: string): { key: TranslationKey; tone: 'positive' | 'warning' } {
  const normalized = value.trim().toLowerCase();
  if (['ok', 'healthy', 'ready', 'connected', 'active', 'available', 'up'].includes(normalized)) return { key: 'admin.healthy', tone: 'positive' };
  return { key: 'admin.disconnected', tone: 'warning' };
}

export default function AdminScreen() {
  const { t } = useI18n();
  const [data, setData] = useState<AdminOverview>();
  const [status, setStatus] = useState<'loading' | 'auth' | 'forbidden' | 'error'>('loading');
  const load = useCallback(async () => {
    setStatus('loading');
    try { setData(await getAdminOverview()); }
    catch (error) { setData(undefined); setStatus(error instanceof AdminApiError && error.status === 401 ? 'auth' : error instanceof AdminApiError && error.status === 403 ? 'forbidden' : 'error'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const database = data ? databaseStatusKey(data.database.status) : undefined;

  return <SafeAreaView style={s.page}><SeoHead title="ENKH Admin" description="ENKH системийн хамгаалагдсан, зөвхөн унших төлөв." path="/admin" noIndex/><AppHeader active="admin"/>
    <ScrollView contentContainerStyle={s.content}><View style={s.heading}><View style={s.headingCopy}><Text accessibilityRole="header" style={s.title}>{t('admin.title')}</Text><Text style={s.subtitle}>{t('admin.subtitle')}</Text></View>
      {data && <Pressable accessibilityRole="button" onPress={() => void load()} style={({ pressed }) => [s.secondary, pressed && s.pressed]}><Text style={s.secondaryText}>{t('common.retry')}</Text></Pressable>}
    </View>
    {status === 'loading' && !data && <View style={s.state}><ActivityIndicator/><Text>{t('common.loading')}</Text></View>}
    {status === 'auth' && <State title={t('admin.signIn')} body={t('admin.signInHelp')} actionLabel={t('account.signIn')} action={() => void Linking.openURL(adminLoginUrl)}/>}
    {status === 'forbidden' && <State title={t('admin.forbidden')} body={t('admin.forbiddenHelp')}/>}
    {status === 'error' && <State title={t('admin.unavailable')} body={t('admin.retryHelp')} actionLabel={t('common.retry')} action={() => void load()}/>}
    {data && <><View style={s.notice}><Text style={s.noticeText}>{t('admin.readOnly')}</Text></View>
      <Text style={s.section}>{t('admin.overview')}</Text>
      <View style={s.grid}><Metric label={t('admin.workspaceAccounts')} value={data.accounts.withWorkspace}/><Metric label={t('admin.workspaceRecords')} value={data.workspaces.records}/><Metric label={t('admin.workspaceUpdated')} value={data.workspaces.updated24h}/><Metric label={t('admin.reminderTotal')} value={data.reminders.total}/><Metric label={t('admin.reminderScheduled')} value={data.reminders.scheduled}/><Metric label={t('admin.reminderDelivered')} value={data.reminders.delivered}/><Metric label={t('admin.reminderFailed')} value={data.reminders.failed}/><Metric label={t('admin.messenger24h')} value={data.activity.messengerMessages24h}/></View>
      <Text style={s.section}>{t('admin.systemStatus')}</Text>
      <View style={s.statusGrid}><StatusCard label={t('admin.database')} status={t(database!.key)} tone={database!.tone}/><StatusCard label={t('admin.router')} status={data.services.aiRouter?.configured ? t('admin.configured') : t('admin.notConfigured')} tone={data.services.aiRouter?.configured ? 'positive' : 'neutral'}/><StatusCard label={t('admin.page')} status={data.services.pagePublishing?.configured ? t('admin.configured') : t('admin.notConfigured')} tone={data.services.pagePublishing?.configured ? 'positive' : 'neutral'}/></View>
      <Text style={s.section}>{t('admin.management')}</Text>
      <View style={s.managementList}><ManagementAction title={t('admin.users')} description={t('admin.manageUsersHelp')} actionLabel={t('common.open')} onPress={() => router.push('/admin/users' as never)}/><ManagementAction title={t('admin.pageContent')} description={t('admin.managePageHelp')} actionLabel={t('admin.unavailableAction')} disabled/><ManagementAction title={t('admin.dataDashboard')} description={t('admin.manageDataHelp')} actionLabel={t('common.open')} onPress={() => router.push('/admin/data')}/></View>
    </>}
  </ScrollView></SafeAreaView>;
}

function State({ title, body, actionLabel, action }: { title: string; body: string; actionLabel?: string; action?: () => void }) {
  return <View style={s.state}><Text style={s.stateTitle}>{title}</Text><Text style={s.body}>{body}</Text>{action && <Pressable accessibilityRole="button" onPress={action} style={s.primary}><Text style={s.primaryText}>{actionLabel}</Text></Pressable>}</View>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FD' }, content: { width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 28, paddingBottom: 60 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, headingCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 280 }, title: { fontSize: 34, fontWeight: '900', color: '#102A43' }, subtitle: { marginTop: 6, fontSize: 15, lineHeight: 22, color: '#627D98' },
  notice: { marginTop: 20, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: '#EAF2FF' }, noticeText: { fontSize: 13, fontWeight: '800', color: '#0B57D0' }, section: { marginTop: 28, marginBottom: 11, fontSize: 19, fontWeight: '900', color: '#102A43' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { flexGrow: 1, flexBasis: 150, minWidth: 140, minHeight: 92, padding: 15, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFEAF7' }, metricLabel: { fontSize: 12, lineHeight: 17, fontWeight: '800', color: '#627D98' }, metricValue: { marginTop: 8, fontSize: 24, lineHeight: 29, fontWeight: '900', color: '#102A43' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statusCard: { flexGrow: 1, flexBasis: 210, minWidth: 190, minHeight: 82, padding: 15, gap: 10, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFEAF7' }, statusLabel: { fontSize: 13, fontWeight: '800', color: '#486581' },
  badge: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }, badgePositive: { backgroundColor: '#E8F7EF' }, badgeNeutral: { backgroundColor: '#EDF2F7' }, badgeWarning: { backgroundColor: '#FFF3E0' }, badgeText: { maxWidth: 210, fontSize: 12, lineHeight: 16, fontWeight: '900' }, badgeTextPositive: { color: '#18794E' }, badgeTextNeutral: { color: '#526D82' }, badgeTextWarning: { color: '#9A5B13' },
  managementList: { gap: 10 }, managementCard: { minHeight: 82, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 15, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DFEAF7' }, managementCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 260 }, managementTitle: { fontSize: 15, fontWeight: '900', color: '#102A43' }, managementDescription: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#627D98' },
  managementButton: { minHeight: 40, minWidth: 104, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 11, backgroundColor: '#0B57D0' }, managementButtonDisabled: { backgroundColor: '#EDF2F7' }, managementButtonText: { fontSize: 13, fontWeight: '900', color: '#FFF' }, managementButtonTextDisabled: { color: '#627D98' },
  state: { minHeight: 240, marginTop: 24, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, borderRadius: 18, backgroundColor: '#FFF' }, stateTitle: { fontSize: 20, fontWeight: '900', color: '#102A43' }, body: { textAlign: 'center', fontSize: 14, lineHeight: 22, color: '#627D98' }, primary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#0B57D0' }, primaryText: { fontWeight: '800', color: '#FFF' }, secondary: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 11, backgroundColor: '#EAF2FF' }, secondaryText: { fontWeight: '800', color: '#0B57D0' }, pressed: { opacity: 0.72 },
});
