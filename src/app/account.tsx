import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authLoginUrl, authLogoutUrl, AuthState, getAuthState } from '../api';
import { AppHeader } from '../components/app-header';

export default function AccountScreen() {
  const [auth, setAuth] = useState<AuthState>();
  const [error, setError] = useState(false);
  const load = async () => { setError(false); try { setAuth(await getAuthState()); } catch { setError(true); } };
  useEffect(() => { void load(); }, []);
  return <SafeAreaView style={styles.page}><AppHeader active="account" /><ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>Account</Text><Text style={styles.subtitle}>ENKH account болон workspace-ийн төлөв.</Text>
    {!auth && !error && <View style={styles.card}><ActivityIndicator /><Text style={styles.body}>Нэвтрэлтийн төлөв шалгаж байна…</Text></View>}
    {error && <View style={styles.card}><Text style={styles.cardTitle}>Account service түр холбогдсонгүй</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.button}><Text style={styles.buttonText}>Дахин оролдох</Text></Pressable></View>}
    {auth && !auth.authenticated && <View style={styles.card}><Text style={styles.label}>LOCAL WORKSPACE</Text><Text style={styles.cardTitle}>Нэвтрээгүй байна</Text><Text style={styles.body}>Одоогийн local history хэвээр хадгалагдана. Нэвтэрсний дараа cloud руу import хийх эсэхээ та өөрөө сонгоно.</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(authLoginUrl)} style={styles.button}><Text style={styles.buttonText}>Нэвтрэх</Text></Pressable></View>}
    {auth?.authenticated && <View style={styles.card}><Text style={styles.label}>SIGNED IN</Text><Text style={styles.cardTitle}>{auth.user?.name || auth.user?.email || 'ENKH хэрэглэгч'}</Text><Text style={styles.body}>Cloud workspace control Workspace хуудсанд идэвхтэй. Local data автоматаар устахгүй.</Text><Pressable accessibilityRole="link" onPress={() => void Linking.openURL(authLogoutUrl)} style={styles.secondary}><Text style={styles.secondaryText}>Гарах</Text></Pressable></View>}
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F4F8FD'},content:{width:'100%',maxWidth:920,alignSelf:'center',paddingHorizontal:20,paddingVertical:36,gap:16},title:{fontSize:36,fontWeight:'900',color:'#102A43'},subtitle:{fontSize:15,lineHeight:23,color:'#627D98'},card:{padding:24,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#DFEAF7'},label:{fontSize:11,fontWeight:'900',letterSpacing:1.2,color:'#829AB1'},cardTitle:{marginTop:10,fontSize:21,fontWeight:'800',color:'#102A43'},body:{marginTop:9,fontSize:15,lineHeight:23,color:'#526D82'},button:{alignSelf:'flex-start',minHeight:48,justifyContent:'center',marginTop:18,paddingHorizontal:18,borderRadius:13,backgroundColor:'#0B57D0'},buttonText:{color:'#FFF',fontWeight:'800'},secondary:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',marginTop:18,paddingHorizontal:14,borderRadius:12,backgroundColor:'#EAF2FF'},secondaryText:{fontWeight:'800',color:'#0B57D0'}});
