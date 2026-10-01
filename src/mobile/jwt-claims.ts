function decodeBase64UrlUtf8(value: string): string {
  if (!value || value.length > 16_384 || !/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('MOBILE_TOKEN_INVALID');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  let binary: string;
  try { binary = atob(base64); } catch { throw new Error('MOBILE_TOKEN_INVALID'); }
  try {
    let encoded = '';
    for (let index = 0; index < binary.length; index += 1)
      encoded += `%${binary.charCodeAt(index).toString(16).padStart(2, '0')}`;
    return decodeURIComponent(encoded);
  } catch { throw new Error('MOBILE_TOKEN_INVALID'); }
}

export function decodeMobileJwtClaims(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('MOBILE_TOKEN_INVALID');
  try {
    const payload = JSON.parse(decodeBase64UrlUtf8(parts[1])) as unknown;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
    return payload as Record<string, unknown>;
  } catch { throw new Error('MOBILE_TOKEN_INVALID'); }
}

export function normalizeMobileDisplayName(value?: string): string | null {
  const name = value?.trim().replace(/\s+/g, ' ').slice(0, 200) || '';
  if (!name) return null;
  if (!/[ÃÐÑ]/.test(name)) return name;
  try {
    let encoded = '';
    for (const character of name) {
      const byte = character.charCodeAt(0);
      if (byte > 255) return name;
      encoded += `%${byte.toString(16).padStart(2, '0')}`;
    }
    const decoded = decodeURIComponent(encoded).trim().replace(/\s+/g, ' ').slice(0, 200);
    return decoded || name;
  } catch { return name; }
}

export function mobileDisplayInitial(value?: string, fallback = 'Э'): string {
  const normalized = normalizeMobileDisplayName(value) || normalizeMobileDisplayName(fallback) || 'Э';
  return (Array.from(normalized)[0] || 'Э').toLocaleUpperCase();
}
