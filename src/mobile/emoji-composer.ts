export const quickEmojis = ['😀', '😄', '😂', '😊', '😍', '🥰', '😎', '🤔', '😢', '😭', '🙏', '👍', '👏', '❤️', '🔥', '🎉', '✅', '💪', '👋', '🙂'] as const;

export function appendQuickEmoji(draft: string, emoji: string, maxLength: number) {
  if (!quickEmojis.includes(emoji as typeof quickEmojis[number]) || draft.length + emoji.length > maxLength) return draft;
  return draft + emoji;
}
