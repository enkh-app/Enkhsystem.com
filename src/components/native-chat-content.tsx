import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { chatImageParts } from '../mobile/chat-image-parts';

function ChatImage({ uri, alt }: { uri: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  return !uri || failed ? <Text style={styles.fallback}>Зургийг ачаалж чадсангүй.{alt ? ` ${alt}` : ''}</Text> :
    <Image source={{ uri }} accessibilityLabel={alt || 'Чатын зураг'}
      resizeMode="contain" style={styles.image} onError={() => setFailed(true)} />;
}
export function NativeChatContent({ content }: { content: string }) {
  return <View>{chatImageParts(content).map((part, index) => part.kind === 'image' ?
    <ChatImage key={`${index}:${part.uri}`} uri={part.uri} alt={part.alt} /> :
    <Text key={index} selectable style={styles.text}>{part.text}</Text>)}</View>;
}
const styles = StyleSheet.create({
  text: { color: '#243B53', fontSize: 15, lineHeight: 22 },
  image: { width: 220, maxWidth: '100%', height: 200, marginVertical: 6 },
  fallback: { color: '#627D98', fontSize: 13, lineHeight: 19 },
});
