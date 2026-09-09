import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { backgroundWorkspaceSync, workspaceSyncLabel, WorkspaceSyncSnapshot } from '../workspace-sync';
import { loadWorkspace } from '../workspace-store';

export function WorkspaceSyncBootstrap() {
  useEffect(() => { void backgroundWorkspaceSync.initialize(loadWorkspace().state); }, []);
  return null;
}

export function WorkspaceSyncStatus() {
  const [state, setState] = useState<WorkspaceSyncSnapshot>(backgroundWorkspaceSync.getSnapshot());
  useEffect(() => {
    const unsubscribe = backgroundWorkspaceSync.subscribe(() => setState(backgroundWorkspaceSync.getSnapshot()));
    void backgroundWorkspaceSync.initialize(loadWorkspace().state);
    const retry = () => backgroundWorkspaceSync.retry();
    if (typeof window !== 'undefined') window.addEventListener('online', retry);
    return () => { unsubscribe(); if (typeof window !== 'undefined') window.removeEventListener('online', retry); };
  }, []);
  const label = workspaceSyncLabel(state.phase);
  return <Pressable accessibilityLabel={label} accessibilityRole={state.phase === 'pending' ? 'button' : undefined} onPress={state.phase === 'pending' ? () => backgroundWorkspaceSync.retry() : undefined} style={styles.pill}><Text style={[styles.text, state.phase === 'conflict' && styles.conflict]}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ pill:{minHeight:36,paddingHorizontal:10,borderRadius:10,backgroundColor:'#F0F0EC',justifyContent:'center'},text:{fontSize:10,letterSpacing:0.7,fontWeight:'900',color:'#595959'},conflict:{color:'#8B2C20'} });
