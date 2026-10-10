export type ChatImagePart = { kind: 'text'; text: string } | { kind: 'image'; alt: string; uri: string | null };
export function chatImageParts(content: string): ChatImagePart[] {
  const parts: ChatImagePart[] = [];
  const pattern = /!\[([^\]\n]{0,200})\]\(([^\s)]{1,2048})\)/g;
  let offset = 0;
  for (const match of content.matchAll(pattern)) {
    if (match.index! > offset) parts.push({ kind: 'text', text: content.slice(offset, match.index) });
    let uri: string | null = null;
    try {
      const url = new URL(match[2]);
      // No credentials, local networks or non-HTTPS protocols in remote message images.
      if (url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) &&
        !/(^|\.)(localhost|local|internal)$/i.test(url.hostname)) uri = url.href;
    } catch { /* Unsupported image URL gets a bounded fallback. */ }
    parts.push({ kind: 'image', alt: match[1], uri });
    offset = match.index! + match[0].length;
    if (parts.filter(part => part.kind === 'image').length >= 8) break;
  }
  if (offset < content.length) parts.push({ kind: 'text', text: content.slice(offset) });
  return parts;
}
