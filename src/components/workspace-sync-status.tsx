import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { backgroundWorkspaceSync, workspaceSyncLabel, WorkspaceSyncSnapshot } from '../workspace-sync';
import { loadWorkspace } from '../workspace-store';

export function WorkspaceSyncStatus() {
  const [state, setState] = useState<WorkspaceSyncSnapshot>(backgroundWorkspaceSync.getSnapshot());
  useEffect(() => {
    const unsubscribe = backgroundWorkspaceSync.subscribe(() => setState(backgroundWorkspaceSync.getSnapshot()));
    void backgroundWorkspaceSync.initialize(loadWorkspace().state);
    const retry = () => backgroundWorkspaceSync.retry();
    if (typeof window !== 'undefined') window.addEventListener('online', retry);
    return () => { unsubscribe(); if (typeof window !== 'undefined') window.removeEventListener('online', retry); };
  }, []);
  return <Pressable accessibilityRole={state.phase === 'pending' ? 'button' : undefined} onPress={state.phase === 'pending' ? () => backgroundWorkspaceSync.retry() : undefined}><Text style={[styles.text, state.phase === 'conflict' && styles.conflict]}>{workspaceSyncLabel(state.phase)}</Text></Pressable>;
}
const styles = StyleSheet.create({ text:{minHeight:44,textAlignVertical:'center',fontSize:9,letterSpacing:1.1,fontWeight:'900',color:'#777'},conflict:{color:'#8B2C20'} });
