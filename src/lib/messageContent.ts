export type MessageContent =
  | { type: 'text'; body: string }
  | { type: 'file'; url: string; name: string; size: number; mimeType: string }
  | { type: 'sticker'; url: string }
  | { type: 'info'; body: string };

export function parseContent(raw: unknown): MessageContent {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as MessageContent;
    } catch {
      return { type: 'text', body: raw };
    }
  }
  if (raw && typeof raw === 'object') return raw as MessageContent;
  return { type: 'text', body: String(raw ?? '') };
}

export function textContent(body: string): MessageContent {
  return { type: 'text', body };
}
