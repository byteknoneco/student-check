import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppNotification } from '../types';
import { theme } from '../theme';

export function NotificationCenter({
  visible,
  notifications,
  onClose,
  onRead,
  onReadAll,
  onDelete,
  onRestore,
  onClearRead,
  onClearAll,
}: {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onRead: (id: string) => Promise<void> | void;
  onReadAll: () => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onRestore: (id: string) => Promise<void> | void;
  onClearRead: () => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
}) {
  const unread = notifications.filter((n) => !n.read_at).length;
  const [lastDeleted, setLastDeleted] = useState<string | null>(null);

  const removeOne = async (id: string) => {
    await onDelete(id);
    setLastDeleted(id);
  };
  const undo = async () => {
    if (!lastDeleted) return;
    const id = lastDeleted;
    setLastDeleted(null);
    await onRestore(id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>BİLDİRİM MERKEZİ</Text>
              <Text style={styles.title}>Bildirimler</Text>
              <Text style={styles.meta}>{unread ? `${unread} okunmamış bildirim` : 'Tüm bildirimler okundu'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>x</Text></Pressable>
          </View>
          <View style={styles.toolbar}>
            {unread ? <Pressable onPress={onReadAll} style={styles.tool}><Text style={styles.toolText}>Tümünü oku</Text></Pressable> : null}
            <Pressable onPress={onClearRead} style={styles.tool}><Text style={styles.toolText}>Okunanları sil</Text></Pressable>
            <Pressable onPress={() => Alert.alert('Tüm bildirimleri sil', 'Bildirimlerin tamamı çöp kutusuna taşınsın mı?', [{text:'Vazgeç',style:'cancel'},{text:'Sil',style:'destructive',onPress:()=>{void onClearAll();}}])} style={styles.toolDanger}><Text style={styles.toolDangerText}>Tümünü sil</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {notifications.length ? notifications.map((n) => (
              <View key={n.id} style={[styles.item, !n.read_at && styles.unread]}>
                <Pressable onPress={() => onRead(n.id)} style={styles.itemMain}>
                  <View style={[styles.dot, n.read_at && styles.dotRead]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{n.title}</Text>
                    <Text style={styles.body}>{n.body}</Text>
                    <Text style={styles.date}>{new Date(n.created_at).toLocaleString('tr-TR')}</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => { void removeOne(n.id); }} style={styles.delete}><Text style={styles.deleteText}>Sil</Text></Pressable>
              </View>
            )) : <Text style={styles.empty}>Henüz bildirim yok.</Text>}
            <View style={{ height: 20 }} />
          </ScrollView>
          {lastDeleted ? <View style={styles.undo}><Text style={styles.undoText}>Bildirim silindi.</Text><Pressable onPress={() => { void undo(); }}><Text style={styles.undoAction}>Geri al</Text></Pressable></View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(18,22,40,0.48)' },
  sheet: { maxHeight: '90%', backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eyebrow: { fontSize: 9, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 22, marginTop: 3 },
  meta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.textMuted, fontWeight: '900', fontSize: 18 },
  toolbar:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:16,paddingTop:12},
  tool:{paddingHorizontal:11,paddingVertical:9,borderRadius:11,backgroundColor:'#EEF0FF'},toolText:{color:theme.colors.primary,fontWeight:'900',fontSize:10},
  toolDanger:{paddingHorizontal:11,paddingVertical:9,borderRadius:11,backgroundColor:theme.colors.dangerSoft},toolDangerText:{color:theme.colors.danger,fontWeight:'900',fontSize:10},
  list: { padding: 16, gap: 10 },
  item: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow:'hidden' },
  unread: { borderColor: '#C9CAFF', backgroundColor: '#F6F6FF' },
  itemMain:{flexDirection:'row',gap:12,padding:14,paddingBottom:10},
  dot: { width: 9, height: 9, borderRadius: 9, backgroundColor: theme.colors.primary, marginTop: 4 },
  dotRead: { backgroundColor: '#CED2DE' },
  itemTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  date: { color: '#9CA3B7', fontSize: 9, marginTop: 7 },
  delete:{alignSelf:'flex-end',paddingHorizontal:14,paddingVertical:8},deleteText:{color:theme.colors.danger,fontWeight:'900',fontSize:10},
  empty: { color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 30 },
  undo:{position:'absolute',left:16,right:16,bottom:18,backgroundColor:'#232846',borderRadius:14,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},undoText:{color:'white',fontWeight:'700',fontSize:11},undoAction:{color:'#B9BAFF',fontWeight:'900',fontSize:11}
});
