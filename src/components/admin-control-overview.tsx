import { StyleSheet, Text, View } from 'react-native';
import type { ControlSnapshot } from '../admin/control-types';
import type { AdminOverview } from '../api';
import { useI18n } from '../i18n';
import { AdminConfigEditor } from './admin-config-editor';
import { AdminPlatformCard } from './admin-platform-card';
import { AdminReleaseHistory } from './admin-release-history';
import { AdminSystemCard } from './admin-system-card';
import { controlCopy } from '../admin/control-copy';
import { platformAvailability } from '../admin/control-status';

export function AdminControlOverview({ snapshot, overview }: { snapshot?: ControlSnapshot; overview?: AdminOverview }) {
  const { t, language }=useI18n();
  const copy=controlCopy[language];
  const platform=(id:string)=>snapshot?.platforms.find(item=>item.platform===id);
  const card=(id:'web'|'desktop'|'ios'|'android'|'backend',label:string)=>{const item=platform(id);return <AdminPlatformCard key={id} title={label} source={item?.releaseId} availability={platformAvailability(item)} evidence={item?.evidence||'unknown'} detail={item ? [item.environment,item.version,item.build,`${copy.source}: /api/admin/control`].filter(Boolean).join(' · ') : undefined}/>};
  return <>
    <Text style={s.section}>{copy.summary}</Text>
    <View style={s.legend}>{copy.legend.map(line => <Text key={line} style={s.legendLine}>{line}</Text>)}</View>
    <Text style={s.section}>{t('control.platforms')}</Text><View style={s.grid}>{card('web',t('control.web'))}{card('desktop',t('control.desktop'))}{card('ios','iOS')}{card('android','Android')}{card('backend',t('control.backend'))}</View>
    {!snapshot?.platforms.length && <Text style={s.mobile}>{copy.missing}</Text>}
    <Text style={s.section}>{t('control.systems')}</Text><View style={s.grid}><AdminSystemCard title={t('control.aiRouter')} description={overview?.services.aiRouter?.configured?`${copy.router} ${copy.source}: /api/admin/overview · services.aiRouter.configured`:''} evidence={overview?.services.aiRouter?.configured?'configured':'unknown'}/><AdminSystemCard title={t('control.database')} description={overview?.database?.status?`${copy.database} ${copy.source}: /api/admin/overview · database.status`:''} evidence={overview?.database?.status?'observed':'unknown'}/><AdminSystemCard title={t('control.reminder')} description={overview?.reminders && Number.isFinite(overview.reminders.total)?`${copy.reminder} ${copy.source}: /api/admin/overview · reminders`:''} evidence={overview?.reminders && Number.isFinite(overview.reminders.total)?'observed':'unknown'}/><AdminSystemCard title={t('control.integrations')} description={overview?.services.pagePublishing?.configured?`${copy.source}: /api/admin/overview · services.pagePublishing.configured`:''} evidence={overview?.services.pagePublishing?.configured?'configured':'unknown'}/></View>
    <Text style={s.section}>{copy.management}</Text><AdminConfigEditor/>
    <Text style={s.section}>{t('control.releaseHistory')}</Text><AdminReleaseHistory releases={snapshot?.releases}/>
  </>;
}
const s=StyleSheet.create({section:{marginTop:28,marginBottom:11,fontSize:19,fontWeight:'900',color:'#102A43'},legend:{gap:8},legendLine:{fontSize:13,lineHeight:20,color:'#627D98'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},mobile:{marginTop:12,fontSize:13,color:'#627D98'}});
