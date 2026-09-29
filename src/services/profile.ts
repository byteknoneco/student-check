import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  const size = asset.fileSize ?? file.size ?? 0;
  if (size > MAX_AVATAR_BYTES) throw new Error('Profil fotografi 5 MB sinirini asiyor.');
  const mimeType = asset.mimeType || file.type || 'image/jpeg';
  if (!mimeType.startsWith('image/')) throw new Error('Gecerli bir fotograf secin.');
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('heic') ? 'heic' : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const body = await file.arrayBuffer();
  const upload = await supabase.storage.from(BUCKET).upload(path, body, { contentType: mimeType, cacheControl: '3600', upsert: false });
  if (upload.error) throw upload.error;

  const previous = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
  const update = await supabase.from('profiles').update({ avatar_url: path }).eq('id', userId);
  if (update.error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw update.error;
  }
  const oldPath = previous.data?.avatar_url as string | null | undefined;
  if (oldPath && oldPath !== path) await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => undefined);
  return path;
}

export async function removeAvatar(userId: string, currentPath?: string | null) {
  if (!supabase) return;
  const update = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
  if (update.error) throw update.error;
  if (currentPath) await supabase.storage.from(BUCKET).remove([currentPath]).catch(() => undefined);
}

export async function getAvatarSignedUrl(path?: string | null): Promise<string | null> {
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
