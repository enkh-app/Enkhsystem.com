import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export async function pickChatImage(): Promise<string | null> {
  const selected = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1
  });
  if (selected.canceled || !selected.assets[0]?.uri) return null;
  const asset = selected.assets[0];
  const result = await manipulateAsync(asset.uri, asset.width > 1600 ? [{ resize: { width: 1600 } }] : [],
    { compress: 0.82, format: SaveFormat.JPEG });
  const source = new File(result.uri);
  if (!source.exists || !source.size || source.size > 10_000_000) throw new Error('IMAGE_SIZE_LIMIT');
  const target = new File(Paths.document, `enkh-chat-${Crypto.randomUUID()}.jpg`);
  await source.copy(target);
  return target.uri;
}

export async function removeChatImage(uri: string) {
  if (!uri.startsWith(Paths.document.uri) || !/\/enkh-chat-[0-9a-f-]+\.jpg$/.test(uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
