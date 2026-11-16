import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const BUCKET = 'avatars';
/** Longest side of the photo shown in the crop screen. */
const EDIT_MAX = 2048;
/** Side of the uploaded square avatar. */
export const AVATAR_SIZE = 512;

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** What part of the picked image ended up inside the crop circle, in image pixels. */
export interface CropRect {
  originX: number;
  originY: number;
  size: number;
}

/**
 * Opens the photo library. The result is re-encoded so its width and height match
 * what is displayed (EXIF rotation applied) and huge camera photos are downsized.
 */
export async function pickAvatarImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets?.length) return null;

  const { uri, width, height } = result.assets[0];
  const fit = width >= height ? { maxWidth: EDIT_MAX } : { maxHeight: EDIT_MAX };
  const image = await ImageManipulator.manipulate(uri, fit).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Cuts the chosen square out of the image and scales it to the avatar size. */
export async function cropAvatar(uri: string, rect: CropRect): Promise<string> {
  const image = await ImageManipulator.manipulate(uri)
    .crop({ originX: rect.originX, originY: rect.originY, width: rect.size, height: rect.size })
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
    .renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return saved.uri;
}

async function readBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).arrayBuffer();
}

/** Deletes every file in the user's folder except `keep`. */
async function removeOldAvatars(userId: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((path) => path !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

/** Uploads the cropped avatar and returns its public URL. */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  // A new name per upload, so phones never show a cached older picture.
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await readBytes(uri), { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  removeOldAvatars(userId, path).catch(() => undefined);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteAvatarFiles(userId: string) {
  await removeOldAvatars(userId);
}
