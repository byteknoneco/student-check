import React, { ReactNode } from 'react';
import { Image, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';
import { UserRole } from '../types';

export type TabKey = 'home' | 'students' | 'calendar' | 'homework' | 'profile';

const tabLabels: Record<TabKey, { label: string; icon: string }> = {
  home: { label: 'Ana Sayfa', icon: '⌂' },
  students: { label: 'Öğrenciler', icon: '◉' },
  calendar: { label: 'Takvim', icon: '▣' },
  homework: { label: 'Ödevler', icon: '✓' },
  profile: { label: 'Profil', icon: '●' },
};

export function AppShell({
  children,title,subtitle,role,activeTab,onTab,refreshing=false,onRefresh,notificationCount=0,messageCount=0,onNotifications,onMessages,onSearch,avatarUri,
}: {
  children: ReactNode; title:string; subtitle?:string; role:UserRole; activeTab:TabKey; onTab:(tab:TabKey)=>void; refreshing?:boolean; onRefresh?:()=>void;
  notificationCount?:number; messageCount?:number; onNotifications?:()=>void; onMessages?:()=>void; onSearch?:()=>void; avatarUri?:string|null;
}) {
  const tabs: TabKey[] = role === 'teacher' ? ['home','students','calendar','homework','profile'] : ['home','calendar','homework','profile'];
  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.topbar}>
      <View style={{flex:1}}><Text style={styles.brand}>DersTakip<Text style={{color:theme.colors.secondary}}>+</Text></Text><Text style={styles.title}>{title}</Text>{subtitle?<Text style={styles.subtitle}>{subtitle}</Text>:null}</View>
      {onSearch?<Pressable onPress={onSearch} style={styles.iconButton}><Text style={styles.searchText}>⌕</Text></Pressable>:null}
      {onMessages?<Pressable onPress={onMessages} style={styles.iconButton}><Text style={styles.messageText}>M</Text>{messageCount>0?<View style={styles.badge}><Text style={styles.badgeText}>{messageCount>99?'99+':messageCount}</Text></View>:null}</Pressable>:null}
      {onNotifications?<Pressable onPress={onNotifications} style={styles.iconButton}><Text style={styles.bellText}>!</Text>{notificationCount>0?<View style={styles.badge}><Text style={styles.badgeText}>{notificationCount>99?'99+':notificationCount}</Text></View>:null}</Pressable>:null}
      {onRefresh?<Pressable onPress={onRefresh} style={styles.iconButton}><Text style={styles.refreshText}>↻</Text></Pressable>:null}
      {avatarUri?<Image source={{uri:avatarUri}} style={styles.avatarImage}/>:<View style={styles.avatar}><Text style={styles.avatarText}>{role==='teacher'?'Ö':role==='parent'?'V':'A'}</Text></View>}
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]}/>:undefined}>
      {children}<View style={{height:100}}/>
    </ScrollView>
    <View style={styles.bottomNav}>{tabs.map(tab=>{const active=tab===activeTab;return <Pressable key={tab} onPress={()=>onTab(tab)} style={styles.tab}><Text style={[styles.tabIcon,active&&styles.tabActive]}>{tabLabels[tab].icon}</Text><Text style={[styles.tabText,active&&styles.tabActive]}>{tabLabels[tab].label}</Text></Pressable>})}</View>
  </SafeAreaView>;
}

const topPad=Platform.OS==='android'?(RNStatusBar.currentHeight??0)+8:8;
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.background},topbar:{paddingTop:topPad,paddingHorizontal:16,paddingBottom:14,flexDirection:'row',gap:7,justifyContent:'space-between',alignItems:'center',backgroundColor:theme.colors.background},brand:{color:theme.colors.text,fontWeight:'900',fontSize:13,letterSpacing:.5},title:{color:theme.colors.text,fontWeight:'900',fontSize:24,marginTop:5},subtitle:{color:theme.colors.textMuted,marginTop:4,fontSize:11},iconButton:{width:36,height:36,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border,justifyContent:'center',alignItems:'center'},bellText:{color:theme.colors.primary,fontSize:16,fontWeight:'900'},messageText:{color:theme.colors.primary,fontSize:12,fontWeight:'900'},searchText:{color:theme.colors.primary,fontSize:21,fontWeight:'900',marginTop:-3},badge:{position:'absolute',top:-5,right:-5,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:theme.colors.danger,alignItems:'center',justifyContent:'center'},badgeText:{color:'white',fontWeight:'900',fontSize:8},refreshText:{color:theme.colors.primary,fontSize:21,fontWeight:'900',marginTop:-2},avatar:{width:42,height:42,borderRadius:14,backgroundColor:theme.colors.primary,justifyContent:'center',alignItems:'center',...theme.shadow},avatarImage:{width:42,height:42,borderRadius:14,backgroundColor:'#E9EBF4'},avatarText:{color:'white',fontWeight:'900',fontSize:16},content:{paddingHorizontal:18,paddingTop:6,gap:16},bottomNav:{position:'absolute',bottom:12,left:12,right:12,backgroundColor:theme.colors.nav,borderRadius:22,flexDirection:'row',paddingVertical:10,paddingHorizontal:6,...theme.shadow},tab:{flex:1,alignItems:'center',gap:3},tabIcon:{color:'#9096AA',fontSize:20,fontWeight:'800'},tabText:{color:'#9096AA',fontSize:9,fontWeight:'700'},tabActive:{color:'#FFFFFF'}});
