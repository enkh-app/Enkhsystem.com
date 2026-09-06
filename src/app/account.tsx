import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/app-header';

export default function AccountScreen() {
  return <SafeAreaView style={styles.page}><AppHeader active="account" /><ScrollView contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>Account</Text><Text style={styles.subtitle}>Энэ browser дээрх ENKH workspace-ийн төлөв.</Text>
    <View style={styles.card}><Text style={styles.label}>LOCAL WORKSPACE</Text><Text style={styles.cardTitle}>Нэвтрэлт одоогоор идэвхгүй</Text><Text style={styles.body}>Chat, search, calculation history энэ төхөөрөмжийн browser-д хадгалагдана. Cloud sync болон account удирдлага энэ хувилбарт нээгдээгүй.</Text></View>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F7F7F5'},content:{width:'100%',maxWidth:920,alignSelf:'center',paddingHorizontal:20,paddingVertical:28,gap:16},title:{fontSize:34,fontWeight:'900',color:'#171717'},subtitle:{fontSize:15,lineHeight:23,color:'#666'},card:{padding:22,borderRadius:20,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E1DD'},label:{fontSize:11,fontWeight:'900',letterSpacing:1.2,color:'#777'},cardTitle:{marginTop:10,fontSize:21,fontWeight:'800',color:'#171717'},body:{marginTop:9,fontSize:15,lineHeight:23,color:'#555'}});
