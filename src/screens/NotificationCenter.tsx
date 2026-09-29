import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppNotification } from '../types';
import { theme } from '../theme';

export function NotificationCenter({
  visible,
  notifications,
  onClose,
  onRead,
  onReadAll,
}: {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const unread = notifications.filter((n) => !n.read_at).length;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>BILDIRIM MERKEZI</Text>
              <Text style={styles.title}>Bildirimler</Text>
              <Text style={styles.meta}>{unread ? `${unread} okunmamis bildirim` : 'Tum bildirimler okundu'}</Text>
            </View>
            {unread ? <Pressable onPress={onReadAll} style={styles.textButton}><Text style={styles.textButtonLabel}>Tumunu oku</Text></Pressable> : null}
            <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>x</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {notifications.length ? notifications.map((n) => (
              <Pressable key={n.id} onPress={() => onRead(n.id)} style={[styles.item, !n.read_at && styles.unread]}>
                <View style={[styles.dot, n.read_at && styles.dotRead]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{n.title}</Text>
                  <Text style={styles.body}>{n.body}</Text>
                  <Text style={styles.date}>{new Date(n.created_at).toLocaleString('tr-TR')}</Text>
                </View>
              </Pressable>
            )) : <Text style={styles.empty}>Henuz bildirim yok.</Text>}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(18,22,40,0.48)' },
  sheet: { maxHeight: '86%', backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eyebrow: { fontSize: 9, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 22, marginTop: 3 },
  meta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
  close: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.textMuted, fontWeight: '900', fontSize: 18 },
  textButton: { paddingHorizontal: 8, paddingVertical: 10 },
  textButtonLabel: { color: theme.colors.primary, fontWeight: '900', fontSize: 10 },
  list: { padding: 16, gap: 10 },
  item: { flexDirection: 'row', gap: 12, backgroundColor: 'white', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  unread: { borderColor: '#C9CAFF', backgroundColor: '#F6F6FF' },
  dot: { width: 9, height: 9, borderRadius: 9, backgroundColor: theme.colors.primary, marginTop: 4 },
  dotRead: { backgroundColor: '#CED2DE' },
  itemTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  body: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  date: { color: '#9CA3B7', fontSize: 9, marginTop: 7 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', paddingVertical: 30 },
});
