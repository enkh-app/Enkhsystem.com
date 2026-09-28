import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { mobileAccessToken } from './auth.native';
import { resolveMobileChatApiBase } from './chat-api';

export class VoiceServerNotReadyError extends Error {}

/** The backend owns provider credentials and can route this request to n8n later. */
export async function transcribeMobileRecording(uri: string): Promise<string> {
  const base = resolveMobileChatApiBase(process.env.EXPO_PUBLIC_ENKH_CHAT_API_URL);
  const audio = new File(uri);
  if (!audio.size || audio.size > 10_000_000) throw new Error('RECORDING_SIZE_INVALID');
  const token = await mobileAccessToken();
  if (!token || /[\r\n]/.test(token)) throw new Error('SIGN_IN_REQUIRED');
  const form = new FormData();
  form.append('audio', audio, 'question.m4a');
  form.append('language', 'mn-MN');
  const response = await expoFetch(`${base}/api/voice/transcribe`, {
    method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${token}`, 'X-Enkh-Client-Type': Platform.OS === 'android' ? 'android' : 'ios' }, body: form,
  });
  if (response.status === 404) throw new VoiceServerNotReadyError();
  if (!response.ok) throw new Error('TRANSCRIPTION_FAILED');
  const data = await response.json() as { text?: unknown };
  if (typeof data?.text !== 'string' || !data.text.trim() || data.text.length > 12000) throw new Error('INVALID_TRANSCRIPTION');
  return data.text.trim();
}
