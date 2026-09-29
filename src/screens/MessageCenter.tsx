import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DashboardData, Message, Profile } from '../types';
import { deleteMessageEveryone, editMessage, hideMessageForMe, markStudentMessagesRead, sendMessage, unhideMessageForMe } from '../services/appData';
import { theme } from '../theme';

const canModifyEveryone = (m: Message) => Date.now() - new Date(m.created_at).getTime() <= 15 * 60 * 1000 && !m.deleted_at;

export function MessageCenter({visible,profile,data,onClose,onChanged}:{visible:boolean;profile:Profile;data:DashboardData;onClose:()=>void;onChanged:()=>Promise<void>|void}){
  const [studentId,setStudentId]=useState(data.students.find(s=>s.active)?.id??data.students[0]?.id??'');
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [lastHidden,setLastHidden]=useState<string|null>(null);

  useEffect(()=>{if(!data.students.some(s=>s.id===studentId))setStudentId(data.students.find(s=>s.active)?.id??data.students[0]?.id??'')},[data.students,studentId]);
  useEffect(()=>{
    if(!visible||!studentId)return;
    markStudentMessagesRead(studentId).then(()=>onChanged()).catch(()=>undefined);
  },[visible,studentId]);

  const messages=useMemo(()=>data.messages.filter(m=>m.student_id===studentId),[data.messages,studentId]);
  const student=data.students.find(s=>s.id===studentId);
  const unreadIncoming=messages.filter(m=>m.sender_id!==profile.id&&!data.messageReads.some(r=>r.message_id===m.id&&r.user_id===profile.id)).length;

  const submit=async()=>{
    if(!body.trim()||!studentId)return;
    try{
      setBusy(true);
      if(editingId) await editMessage(editingId,body);
      else await sendMessage({studentId,senderId:profile.id,body});
      setBody('');setEditingId(null);await onChanged();
    }catch(e:any){Alert.alert(editingId?'Mesaj düzenlenemedi':'Mesaj gönderilemedi',e?.message??'Bilinmeyen hata');}
    finally{setBusy(false)}
  };

  const startEdit=(m:Message)=>{setEditingId(m.id);setBody(m.body)};
  const hide=async(m:Message)=>{try{await hideMessageForMe(m.id);setLastHidden(m.id);await onChanged();}catch(e:any){Alert.alert('Silinemedi',e?.message??'Mesaj silinemedi.')}};
  const undoHide=async()=>{if(!lastHidden)return;try{const id=lastHidden;setLastHidden(null);await unhideMessageForMe(id);await onChanged();}catch(e:any){Alert.alert('Geri alınamadı',e?.message??'İşlem tamamlanamadı.')}};
  const everyone=async(m:Message)=>{try{await deleteMessageEveryone(m.id);await onChanged();}catch(e:any){Alert.alert('Silinemedi',e?.message??'Mesaj silinemedi.')}};

  const openActions=(m:Message)=>{
    const mine=m.sender_id===profile.id;
    const buttons:any[]=[];
    if(mine&&canModifyEveryone(m)) buttons.push({text:'Düzenle',onPress:()=>startEdit(m)});
    buttons.push({text:'Benden sil',style:'destructive',onPress:()=>{void hide(m)}});
    if(mine&&canModifyEveryone(m)) buttons.push({text:'Herkesten sil',style:'destructive',onPress:()=>Alert.alert('Herkesten sil','Mesaj içeriği kalıcı olarak kaldırılacak.',[{text:'Vazgeç',style:'cancel'},{text:'Sil',style:'destructive',onPress:()=>{void everyone(m)}}])});
    buttons.push({text:'Vazgeç',style:'cancel'});
    Alert.alert('Mesaj işlemleri','Bir işlem seç.',buttons);
  };

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View style={styles.page}>
    <View style={styles.header}><Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>{'<'} </Text></Pressable><View style={{flex:1}}><Text style={styles.eyebrow}>İLETİŞİM</Text><Text style={styles.title}>Mesajlar</Text><Text style={styles.meta}>{student?.full_name??'Öğrenci seçilmedi'}{unreadIncoming?` · ${unreadIncoming} okunmamış`:''}</Text></View></View>
    {data.students.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentRow}>{data.students.filter(s=>s.active).map(s=><Pressable key={s.id} onPress={()=>setStudentId(s.id)} style={[styles.studentChip,s.id===studentId&&styles.studentChipActive]}><Text style={[styles.studentText,s.id===studentId&&styles.studentTextActive]}>{s.full_name}</Text></Pressable>)}</ScrollView>:null}
    <ScrollView contentContainerStyle={styles.list}>{messages.length?messages.map(m=>{const mine=m.sender_id===profile.id;const readers=data.messageReads.filter(r=>r.message_id===m.id&&r.user_id!==profile.id);return <Pressable key={m.id} onLongPress={()=>openActions(m)} delayLongPress={350} style={[styles.message,mine?styles.mine:styles.theirs,m.deleted_at&&styles.deleted]}>
      <Text style={[styles.sender,mine&&styles.mineSender]}>{mine?`Sen - ${m.sender_name||profile.full_name}`:(m.sender_name||'Kullanıcı')}</Text>
      <Text style={[styles.body,mine&&styles.mineText,m.deleted_at&&styles.deletedText]}>{m.deleted_at?'Bu mesaj silindi.':m.body}</Text>
      <View style={styles.messageMeta}><Text style={[styles.date,mine&&styles.mineDate]}>{new Date(m.created_at).toLocaleString('tr-TR')}{m.edited_at&&!m.deleted_at?' · düzenlendi':''}</Text>{mine&&!m.deleted_at?<Text style={[styles.read,mine&&styles.mineDate]}>{readers.length?readers.length===1?'Görüldü':`${readers.length} kişi gördü`:'Gönderildi'}</Text>:null}</View>
    </Pressable>}):<Text style={styles.empty}>Henüz mesaj yok. İlk mesajı sen gönderebilirsin.</Text>}<View style={{height:12}}/></ScrollView>
    {editingId?<View style={styles.editBanner}><Text style={styles.editText}>Mesaj düzenleniyor</Text><Pressable onPress={()=>{setEditingId(null);setBody('')}}><Text style={styles.cancelEdit}>Vazgeç</Text></Pressable></View>:null}
    <View style={styles.composer}><TextInput value={body} onChangeText={setBody} placeholder={editingId?'Yeni mesaj içeriği...':'Ders veya ödev hakkında mesaj yaz...'} placeholderTextColor="#9AA1B4" multiline style={styles.input}/><Pressable onPress={submit} disabled={busy||!body.trim()} style={[styles.send,(busy||!body.trim())&&styles.disabled]}><Text style={styles.sendText}>{editingId?'Kaydet':'Gönder'}</Text></Pressable></View>
    {lastHidden?<View style={styles.undo}><Text style={styles.undoText}>Mesaj senden silindi.</Text><Pressable onPress={()=>{void undoHide()}}><Text style={styles.undoAction}>Geri al</Text></Pressable></View>:null}
  </View></Modal>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:theme.colors.background},header:{paddingTop:46,paddingHorizontal:18,paddingBottom:14,flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'white',borderBottomWidth:1,borderBottomColor:theme.colors.border},close:{width:40,height:40,borderRadius:13,backgroundColor:'#F1F3F8',alignItems:'center',justifyContent:'center'},closeText:{fontWeight:'900',fontSize:18,color:theme.colors.text},eyebrow:{fontSize:9,fontWeight:'900',color:theme.colors.primary,letterSpacing:1},title:{fontSize:21,fontWeight:'900',color:theme.colors.text,marginTop:2},meta:{color:theme.colors.textMuted,fontSize:10,marginTop:3},studentRow:{padding:12,gap:8,maxHeight:60},studentChip:{backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border,borderRadius:12,paddingHorizontal:13,paddingVertical:9},studentChipActive:{backgroundColor:theme.colors.primary,borderColor:theme.colors.primary},studentText:{color:theme.colors.textMuted,fontWeight:'800',fontSize:11},studentTextActive:{color:'white'},list:{padding:16,gap:9},message:{maxWidth:'84%',borderRadius:17,padding:12},mine:{alignSelf:'flex-end',backgroundColor:theme.colors.primary,borderBottomRightRadius:5},theirs:{alignSelf:'flex-start',backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border,borderBottomLeftRadius:5},deleted:{opacity:.72},sender:{fontSize:9,fontWeight:'900',color:theme.colors.primary,marginBottom:5},mineSender:{color:'#E6E7FF'},body:{color:theme.colors.text,fontSize:12,lineHeight:18,fontWeight:'600'},mineText:{color:'white'},deletedText:{fontStyle:'italic'},messageMeta:{marginTop:6,flexDirection:'row',gap:10,justifyContent:'space-between'},date:{fontSize:8,color:theme.colors.textMuted},read:{fontSize:8,color:theme.colors.textMuted,fontWeight:'800'},mineDate:{color:'#E6E7FF'},empty:{color:theme.colors.textMuted,textAlign:'center',marginTop:30},editBanner:{backgroundColor:'#FFF6DF',paddingHorizontal:14,paddingVertical:9,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},editText:{color:'#9A6200',fontSize:10,fontWeight:'900'},cancelEdit:{color:theme.colors.danger,fontSize:10,fontWeight:'900'},composer:{flexDirection:'row',gap:10,padding:14,paddingBottom:24,backgroundColor:'white',borderTopWidth:1,borderTopColor:theme.colors.border,alignItems:'flex-end'},input:{flex:1,minHeight:48,maxHeight:110,borderWidth:1,borderColor:theme.colors.border,borderRadius:15,paddingHorizontal:13,paddingVertical:11,color:theme.colors.text,textAlignVertical:'top'},send:{backgroundColor:theme.colors.primary,borderRadius:14,paddingHorizontal:16,height:48,alignItems:'center',justifyContent:'center'},sendText:{color:'white',fontWeight:'900'},disabled:{opacity:.45},undo:{position:'absolute',left:16,right:16,bottom:92,backgroundColor:'#232846',borderRadius:14,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',justifyContent:'space-between'},undoText:{color:'white',fontWeight:'700',fontSize:11},undoAction:{color:'#B9BAFF',fontWeight:'900',fontSize:11}});
