import { StyleSheet, Text, View } from 'react-native';
import type { ControlSnapshot } from '../admin/control-types';
import type { AdminOverview } from '../api';
import { useI18n } from '../i18n';
import { AdminConfigEditor } from './admin-config-editor';
import { AdminPlatformCard } from './admin-platform-card';
import { AdminReleaseHistory } from './admin-release-history';
import { AdminSystemCard } from './admin-system-card';

export function AdminControlOverview({ snapshot, overview }: { snapshot?: ControlSnapshot; overview?: AdminOverview }) {
  const { t }=useI18n();
  const platform=(id:string)=>snapshot?.platforms.find(item=>item.platform===id);
  const card=(id:'web'|'desktop'|'backend',label:string)=>{const item=platform(id);return <AdminPlatformCard key={id} title={label} evidence={item?.evidence||'unknown'} detail={item ? [item.environment,item.version,item.build].filter(Boolean).join(' · ') : undefined}/>};
  const ios=platform('ios'), android=platform('android');
  return <>
    <Text style={s.section}>{t('control.platforms')}</Text><View style={s.grid}>{card('web',t('control.web'))}{card('desktop',t('control.desktop'))}<AdminPlatformCard title={t('control.mobile')} evidence={ios?.evidence||android?.evidence||'unknown'}><Text style={s.mobile}>iOS · {ios?.version||t('control.notAvailable')}</Text><Text style={s.mobile}>Android · {android?.version||t('control.notAvailable')}</Text></AdminPlatformCard>{card('backend',t('control.backend'))}</View>
    <Text style={s.section}>{t('control.systems')}</Text><View style={s.grid}><AdminSystemCard title={t('control.aiRouter')} description={overview?.services.aiRouter?.configured?t('admin.configured'):t('control.notAvailable')} evidence={overview?.services.aiRouter?.configured?'configured':'unknown'}/><AdminSystemCard title={t('control.database')} description={overview?t('control.overviewAvailable'):t('control.notAvailable')} evidence={overview?'observed':'unknown'}/><AdminSystemCard title={t('control.reminder')} description={overview?t('control.aggregateAvailable'):t('control.notAvailable')} evidence={overview?'observed':'unknown'}/><AdminSystemCard title={t('control.integrations')} description={overview?.services.pagePublishing?.configured?t('admin.configured'):t('control.notAvailable')} evidence={overview?.services.pagePublishing?.configured?'configured':'unknown'}/></View>
    <Text style={s.section}>{t('control.remoteConfig')}</Text><AdminConfigEditor/>
    <Text style={s.section}>{t('control.releaseHistory')}</Text><AdminReleaseHistory releases={snapshot?.releases}/>
  </>;
}
const s=StyleSheet.create({section:{marginTop:28,marginBottom:11,fontSize:19,fontWeight:'900',color:'#102A43'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},mobile:{marginTop:12,fontSize:13,color:'#627D98'}});
