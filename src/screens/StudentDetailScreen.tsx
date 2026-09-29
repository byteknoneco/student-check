import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, ProgressBar, SectionTitle } from '../components/UI';
import { DashboardData, Student, TeacherActionRequest } from '../types';
import { theme } from '../theme';
import { shareStudentReport } from '../services/reports';

export function StudentDetailScreen({
  student,
  data,
  visible,
  onClose,
  onAction,
}: {
  student: Student | null;
  data: DashboardData;
  visible: boolean;
  onClose: () => void;
  onAction: (request: TeacherActionRequest) => void;
}) {
  const d = useMemo(() => {
    if (!student) return null;
    const lessons=data.lessons.filter(x=>x.student_id===student.id);
    const homework=data.homework.filter(x=>x.student_id===student.id);
    const exams=data.exams.filter(x=>x.student_id===student.id);
    const progress=data.topicProgress.filter(x=>x.student_id===student.id);
    const goals=data.goals.filter(x=>x.student_id===student.id);
    const pack=data.packages.find(x=>x.student_id===student.id&&x.active);
    const completed=lessons.filter(x=>x.status==='completed');
    const scores=completed.flatMap(x=>[x.preparation_score,x.participation_score,x.mastery_score,x.homework_score]).filter((x):x is number=>typeof x==='number');
    const avg=scores.length?Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*20):null;
    return {lessons,homework,exams,progress,goals,pack,completed,avg};
  },[student,data]);
  if (!student || !d) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.back}><Text style={styles.backText}>{'<'} </Text></Pressable>
          <View style={{flex:1}}><Text style={styles.eyebrow}>OGRENCI MERKEZI</Text><Text style={styles.title}>{student.full_name}</Text><Text style={styles.meta}>{student.grade_level??'-'} / {student.school??'-'}</Text></View>
          <Pill tone="success">Aktif</Pill>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.quickRow}>
            <Quick label="Ders" onPress={()=>onAction({type:'lesson',studentId:student.id})}/><Quick label="Odev" onPress={()=>onAction({type:'homework',studentId:student.id})}/><Quick label="Gelisim" onPress={()=>onAction({type:'topicProgress',studentId:student.id})}/><Quick label="Hedef" onPress={()=>onAction({type:'goal',studentId:student.id})}/><Quick label="PDF Rapor" onPress={()=>{void shareStudentReport(student,data)}}/>
          </View>
          <View style={styles.grid}>
            <Metric label="Tamamlanan ders" value={String(d.completed.length)}/><Metric label="Bekleyen odev" value={String(d.homework.filter(x=>x.status!=='reviewed').length)}/><Metric label="Performans" value={d.avg===null?'-':`%${d.avg}`}/><Metric label="Kalan paket" value={d.pack?String(d.pack.remaining_lessons):'-'}/>
          </View>
          <SectionTitle title="Konu gelisim haritasi" action="+ Guncelle" onPress={()=>onAction({type:'topicProgress',studentId:student.id})}/>
          <Card>{d.progress.length?d.progress.slice(0,8).map((p,i)=><View key={p.id} style={[styles.progressRow,i>0&&styles.border]}><View style={{flex:1}}><Text style={styles.itemTitle}>{p.topic_name}</Text><Text style={styles.itemMeta}>{p.subject_name}{p.note?` / ${p.note}`:''}</Text><View style={{marginTop:8}}><ProgressBar value={p.mastery_percent}/></View></View><Text style={styles.pct}>%{p.mastery_percent}</Text></View>):<Text style={styles.empty}>Konu gelisimi henuz girilmedi.</Text>}</Card>
          <SectionTitle title="Calisma hedefleri" action="+ Hedef" onPress={()=>onAction({type:'goal',studentId:student.id})}/>
          <Card>{d.goals.length?d.goals.slice(0,6).map((g,i)=>{const pct=Math.min(100,Math.round((g.current_value/g.target_value)*100));return <View key={g.id} style={[styles.goalRow,i>0&&styles.border]}><View style={{flex:1}}><Text style={styles.itemTitle}>{g.title}</Text><Text style={styles.itemMeta}>{g.current_value}/{g.target_value}{g.due_date?` / ${new Date(g.due_date).toLocaleDateString('tr-TR')}`:''}</Text><View style={{marginTop:8}}><ProgressBar value={pct}/></View></View><Pill tone={g.completed?'success':'primary'}>{g.completed?'Tamam':`%${pct}`}</Pill></View>}):<Text style={styles.empty}>Aktif hedef yok.</Text>}</Card>
          <SectionTitle title="Son sinavlar"/>
          <Card>{d.exams.length?[...d.exams].sort((a,b)=>+new Date(b.exam_date)-+new Date(a.exam_date)).slice(0,5).map((e,i)=><View key={e.id} style={[styles.examRow,i>0&&styles.border]}><View style={{flex:1}}><Text style={styles.itemTitle}>{e.title}</Text><Text style={styles.itemMeta}>{e.subject_name} / {new Date(e.exam_date).toLocaleDateString('tr-TR')}</Text></View><Text style={styles.examScore}>%{Math.round(e.score/e.max_score*100)}</Text></View>):<Text style={styles.empty}>Sinav sonucu yok.</Text>}</Card>
          <View style={{height:30}}/>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Quick({label,onPress}:{label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={styles.quick}><Text style={styles.quickText}>+ {label}</Text></Pressable>}
function Metric({label,value}:{label:string;value:string}){return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:theme.colors.background},header:{paddingTop:44,paddingHorizontal:18,paddingBottom:14,flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'white',borderBottomWidth:1,borderBottomColor:theme.colors.border},
  back:{width:40,height:40,borderRadius:13,backgroundColor:'#F1F3F8',alignItems:'center',justifyContent:'center'},backText:{fontWeight:'900',fontSize:18,color:theme.colors.text},eyebrow:{fontSize:9,fontWeight:'900',color:theme.colors.primary,letterSpacing:1},title:{fontSize:21,fontWeight:'900',color:theme.colors.text,marginTop:2},meta:{color:theme.colors.textMuted,fontSize:10,marginTop:3},content:{padding:18,gap:14},
  quickRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},quick:{backgroundColor:theme.colors.primary,borderRadius:12,paddingHorizontal:14,paddingVertical:11},quickText:{color:'white',fontWeight:'900',fontSize:11},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'48%',backgroundColor:'white',borderRadius:16,padding:14,borderWidth:1,borderColor:theme.colors.border},metricLabel:{color:theme.colors.textMuted,fontSize:10,fontWeight:'800'},metricValue:{color:theme.colors.text,fontSize:22,fontWeight:'900',marginTop:7},
  progressRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:11},goalRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:11},examRow:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:11},border:{borderTopWidth:1,borderTopColor:theme.colors.border},itemTitle:{color:theme.colors.text,fontWeight:'900',fontSize:12},itemMeta:{color:theme.colors.textMuted,fontSize:10,marginTop:4},pct:{color:theme.colors.primary,fontWeight:'900',fontSize:16},examScore:{color:theme.colors.primary,fontWeight:'900',fontSize:17},empty:{color:theme.colors.textMuted,textAlign:'center',paddingVertical:10}
});
