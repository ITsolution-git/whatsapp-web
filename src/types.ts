import type { MessageContent } from './lib/messageContent';

// ─── Server wire types ────────────────────────────────────────────────────────

export interface WireSubscriber {
  id: string;
  phoneNumber: string;
  name: string | null;
  createdAt?: string;
  lastSeenAt?: string; // ISO string from server
}

export interface PresenceEntry {
  online: boolean;
  lastSeenAt?: number; // epoch ms
}

export type PresenceMap = Record<string, PresenceEntry>;

export interface WireDevice {
  id: string;
  name: string;
  type: 'phone' | 'web' | 'laptop';
  linkedAt: string;
}

export interface WireVerifyResponse {
  token: string;
  subscriber: WireSubscriber;
}

export interface WireMessageReceived {
  messageId: string;
  content: MessageContent;
  sentAt: string;
  senderId: string;
  targetType: 'dm' | 'group' | 'channel';
  targetId: string;
}

// ─── UI types (what components render) ───────────────────────────────────────

export interface UiMessage {
  id: string;
  roomId: string;
  sentBy: string | null;
  content: MessageContent;
  type: 'text' | 'file' | 'sticker' | 'info';
  sentAt: Date;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  isOwn: boolean;
  replyTo?: string;
}

export interface UiRoom {
  id: string;
  type: 'dm' | 'group' | 'channel' | 'broadcast';
  displayName: string;
  lastActiveAt: number;
  lastMessage?: UiMessage;
  unreadCount: number;
  archived: boolean;
  isBlocked: boolean;
  /** For DM rooms: the other subscriber's ID (used for presence lookup) */
  subscriberId?: string;
}
