import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import {
  PickedHomeworkFile,
  formatHomeworkFileSize,
  pickHomeworkImages,
  pickHomeworkPdf,
  takeHomeworkPhoto,
} from '../services/homeworkFiles';

export function HomeworkAttachmentPicker({
  files,
  onChange,
  label = 'Dosya ekle',
}: {
  files: PickedHomeworkFile[];
  onChange: (files: PickedHomeworkFile[]) => void;
  label?: string;
}) {
  const add = async (source: 'camera' | 'gallery' | 'pdf') => {
    try {
      const next = source === 'camera' ? await takeHomeworkPhoto() : source === 'gallery' ? await pickHomeworkImages() : await pickHomeworkPdf();
      if (next.length) onChange([...files, ...next].slice(0, 8));
    } catch (error: any) {
      Alert.alert('Dosya secilemedi', error?.message ?? 'Dosya secimi tamamlanamadi.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => add('camera')}><Text style={styles.actionText}>📷 Kamera</Text></Pressable>
        <Pressable style={styles.action} onPress={() => add('gallery')}><Text style={styles.actionText}>🖼 Galeri</Text></Pressable>
        <Pressable style={styles.action} onPress={() => add('pdf')}><Text style={styles.actionText}>📄 PDF</Text></Pressable>
      </View>
      {files.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={styles.fileRow}>
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.fileName}>{file.name}</Text><Text style={styles.fileMeta}>{formatHomeworkFileSize(file.size)}</Text></View>
          <Pressable onPress={() => onChange(files.filter((_, i) => i !== index))} style={styles.remove}><Text style={styles.removeText}>Sil</Text></Pressable>
        </View>
      ))}
      <Text style={styles.helper}>Fotograf veya PDF. Dosya basina en fazla 10 MB.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  action: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  actionText: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  fileRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 11 },
  fileName: { color: theme.colors.text, fontWeight: '800', fontSize: 11 },
  fileMeta: { color: theme.colors.textMuted, fontSize: 9.5, marginTop: 3 },
  remove: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: theme.colors.dangerSoft },
  removeText: { color: theme.colors.danger, fontWeight: '900', fontSize: 10 },
  helper: { color: theme.colors.textMuted, fontSize: 9.5, lineHeight: 14 },
});
