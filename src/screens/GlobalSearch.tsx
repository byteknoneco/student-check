import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TabKey } from '../components/AppShell';
import { DashboardData, UserRole } from '../types';
import { theme } from '../theme';

export function GlobalSearch({
  visible,
  data,
  role,
  onClose,
  onStudent,
  onTab,
}: {
  visible: boolean;
  data: DashboardData;
  role: UserRole;
  onClose: () => void;
  onStudent: (studentId: string) => void;
  onTab: (tab: TabKey) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLocaleLowerCase('tr-TR');
  const results = useMemo(() => {
    if (q.length < 2) return [] as { key:string; kind:string; title:string; meta:string; studentId?:string; tab:TabKey }[];
    const rows: { key:string; kind:string; title:string; meta:string; studentId?:string; tab:TabKey }[] = [];
    for (const s of data.students) {
      const hay = `${s.full_name} ${s.grade_level ?? ''} ${s.school ?? ''}`.toLocaleLowerCase('tr-TR');
      if (hay.includes(q)) rows.push({key:`s-${s.id}`,kind:s.active?'Öğrenci':'Arşiv',title:s.full_name,meta:`${s.grade_level ?? '-'} · ${s.school ?? '-'}${s.active?'':' · Arşivde'}`,studentId:s.id,tab:'students'});
    }
    for (const h of data.homework) {
      const hay = `${h.title} ${h.student_name} ${h.subject_name} ${h.description ?? ''}`.toLocaleLowerCase('tr-TR');
      if (hay.includes(q)) rows.push({key:`h-${h.id}`,kind:'Ödev',title:h.title,meta:`${h.student_name} · ${h.subject_name}`,studentId:h.student_id,tab:'homework'});
    }
    for (const l of data.lessons) {
      const hay = `${l.student_name} ${l.subject_name} ${l.topic ?? ''}`.toLocaleLowerCase('tr-TR');
      if (hay.includes(q)) rows.push({key:`l-${l.id}`,kind:'Ders',title:`${l.student_name} · ${l.subject_name}`,meta:`${l.topic ?? 'Konu yok'} · ${new Date(l.starts_at).toLocaleDateString('tr-TR')}`,studentId:l.student_id,tab:'calendar'});
    }
    for (const e of data.exams) {
      const hay = `${e.title} ${e.student_name} ${e.subject_name}`.toLocaleLowerCase('tr-TR');
      if (hay.includes(q)) rows.push({key:`e-${e.id}`,kind:'Sınav',title:e.title,meta:`${e.student_name} · ${Math.round(e.score/e.max_score*100)}%`,studentId:e.student_id,tab:'students'});
    }
    for (const m of data.messages.slice(-120)) {
      if (m.deleted_at) continue;
      const hay = `${m.sender_name ?? ''} ${m.body}`.toLocaleLowerCase('tr-TR');
      if (hay.includes(q)) rows.push({key:`m-${m.id}`,kind:'Mesaj',title:m.sender_name ?? 'Kullanıcı',meta:m.body.slice(0,90),studentId:m.student_id,tab:'home'});
    }
    return rows.slice(0,40);
  }, [q, data]);

  const choose = (item: typeof results[number]) => {
    setQuery('');
    onClose();
    if (role === 'teacher' && item.studentId && (item.kind === 'Öğrenci' || item.kind === 'Arşiv' || item.kind === 'Sınav')) onStudent(item.studentId);
    else onTab(role!=='teacher'&&item.tab==='students'?'home':item.tab);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>{'<'} </Text></Pressable>
          <View style={{flex:1}}><Text style={styles.eyebrow}>GLOBAL ARAMA</Text><Text style={styles.title}>Her şeyi bul</Text></View>
        </View>
        <View style={styles.searchWrap}>
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Öğrenci, ödev, ders, sınav veya mesaj ara..." placeholderTextColor="#9299AB" style={styles.input}/>
        </View>
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {q.length < 2 ? <Text style={styles.empty}>Aramak için en az 2 karakter yaz.</Text> : results.length ? results.map((item) => (
            <Pressable key={item.key} onPress={() => choose(item)} style={styles.row}>
              <View style={styles.kind}><Text style={styles.kindText}>{item.kind.slice(0,1)}</Text></View>
              <View style={{flex:1}}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.meta}>{item.kind} · {item.meta}</Text></View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          )) : <Text style={styles.empty}>Sonuç bulunamadı.</Text>}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:theme.colors.background},
  header:{paddingTop:48,paddingHorizontal:18,paddingBottom:14,flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'white',borderBottomWidth:1,borderBottomColor:theme.colors.border},
  close:{width:40,height:40,borderRadius:13,backgroundColor:'#F1F3F8',alignItems:'center',justifyContent:'center'},
  closeText:{fontWeight:'900',fontSize:18,color:theme.colors.text},eyebrow:{fontSize:9,fontWeight:'900',color:theme.colors.primary,letterSpacing:1},title:{fontSize:21,fontWeight:'900',color:theme.colors.text,marginTop:2},
  searchWrap:{padding:16},input:{height:52,backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border,borderRadius:16,paddingHorizontal:15,color:theme.colors.text,fontWeight:'700'},
  list:{paddingHorizontal:16,paddingBottom:30,gap:9},row:{backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border,borderRadius:16,padding:13,flexDirection:'row',gap:11,alignItems:'center'},kind:{width:38,height:38,borderRadius:12,backgroundColor:'#EEF0FF',alignItems:'center',justifyContent:'center'},kindText:{color:theme.colors.primary,fontWeight:'900'},itemTitle:{color:theme.colors.text,fontWeight:'900',fontSize:12},meta:{color:theme.colors.textMuted,fontSize:10,marginTop:4},chev:{color:theme.colors.textMuted,fontSize:22,fontWeight:'700'},empty:{color:theme.colors.textMuted,textAlign:'center',paddingTop:40}
});
