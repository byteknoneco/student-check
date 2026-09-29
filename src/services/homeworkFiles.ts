import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { HomeworkFile, HomeworkFileKind } from '../types';

export type PickedHomeworkFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

const BUCKET = 'homework-files';
export const MAX_HOMEWORK_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_PICK = 5;

const cleanName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90) || 'file';
const extensionFor = (name: string, mimeType: string) => {
  const fromName = name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,8}$/.test(fromName)) return fromName;
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic') return 'heic';
  if (mimeType === 'image/heif') return 'heif';
  return 'jpg';
};

function normalizePicked(input: { uri: string; name?: string | null; mimeType?: string | null; size?: number | null }): PickedHomeworkFile {
  const local = new File(input.uri);
  const mimeType = input.mimeType || local.type || 'application/octet-stream';
  const size = input.size ?? local.size ?? 0;
  const name = input.name || local.name || `dosya-${Date.now()}.${extensionFor('', mimeType)}`;
  if (size > MAX_HOMEWORK_FILE_BYTES) throw new Error(`${name} 10 MB sinirini asiyor.`);
  if (!(mimeType.startsWith('image/') || mimeType === 'application/pdf')) throw new Error('Sadece fotograf veya PDF yukleyebilirsiniz.');
  return { uri: input.uri, name, mimeType, size };
}

export async function pickHomeworkImages(): Promise<PickedHomeworkFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: MAX_FILES_PER_PICK,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => normalizePicked({ uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType, size: asset.fileSize }));
}

export async function takeHomeworkPhoto(): Promise<PickedHomeworkFile[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Kamera izni verilmedi.');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (result.canceled || !result.assets[0]) return [];
  const asset = result.assets[0];
  return [normalizePicked({ uri: asset.uri, name: asset.fileName, mimeType: asset.mimeType, size: asset.fileSize })];
}

export async function pickHomeworkPdf(): Promise<PickedHomeworkFile[]> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: true });
  if (result.canceled) return [];
  return result.assets.slice(0, MAX_FILES_PER_PICK).map((asset) => normalizePicked({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size }));
}

export async function uploadHomeworkFiles(input: {
  homeworkId: string;
  studentId: string;
  kind: HomeworkFileKind;
  files: PickedHomeworkFile[];
}): Promise<HomeworkFile[]> {
  if (!input.files.length) return [];
  if (!supabase) return [];
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user.id;
  if (!userId) throw new Error('Dosya yuklemek icin tekrar giris yapin.');

  const uploaded: HomeworkFile[] = [];
  try {
    for (const picked of input.files) {
      const ext = extensionFor(picked.name, picked.mimeType);
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `${input.studentId}/${input.homeworkId}/${input.kind}/${userId}/${unique}-${cleanName(picked.name.replace(/\.[^.]+$/, ''))}.${ext}`;
      const file = new File(picked.uri);
      const body = await file.arrayBuffer();
      const upload = await supabase.storage.from(BUCKET).upload(path, body, {
        contentType: picked.mimeType,
        cacheControl: '3600',
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const meta = await supabase.from('homework_files').insert({
        homework_id: input.homeworkId,
        student_id: input.studentId,
        uploaded_by: userId,
        kind: input.kind,
        storage_path: path,
        file_name: picked.name,
        mime_type: picked.mimeType,
        size_bytes: picked.size || file.size || body.byteLength,
      }).select('id,homework_id,student_id,uploaded_by,kind,storage_path,file_name,mime_type,size_bytes,created_at').single();

      if (meta.error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw meta.error;
      }
      uploaded.push(meta.data as HomeworkFile);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) {
      await supabase.from('homework_files').delete().in('id', uploaded.map((file) => file.id));
      await supabase.storage.from(BUCKET).remove(uploaded.map((file) => file.storage_path));
    }
    throw error;
  }
}

export async function openHomeworkFile(file: HomeworkFile) {
  if (!supabase) return;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 15 * 60);
  if (error) throw error;
  const supported = await Linking.canOpenURL(data.signedUrl);
  if (!supported) throw new Error('Dosya bu cihazda acilamadi.');
  await Linking.openURL(data.signedUrl);
}

export async function getHomeworkFileSignedUrl(file: HomeworkFile) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 15 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export function formatHomeworkFileSize(bytes: number) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
