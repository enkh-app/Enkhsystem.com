import { Pressable, StyleSheet, Text, View } from 'react-native';
import { quickEmojis } from '../mobile/emoji-composer';

export function QuickEmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return <View style={styles.panel} accessibilityLabel="Эможи сонгох хэсэг">
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>Эможи</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Эможи хэсгийг хаах" onPress={onClose} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </View>
    <View style={styles.grid}>{quickEmojis.map((emoji) => <Pressable key={emoji} accessibilityRole="button"
      accessibilityLabel={`${emoji} нэмэх`} onPress={() => onSelect(emoji)} style={styles.emojiButton}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { flexShrink: 0, padding: 8, backgroundColor: '#F7FAFE', borderRadius: 14,
    borderWidth: 1, borderColor: '#D7E4F3' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 5 },
  title: { fontSize: 13, fontWeight: '700', color: '#243B53' },
  close: { minWidth: 42, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#486581', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  emojiButton: { width: '20%', minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 25 },
});
