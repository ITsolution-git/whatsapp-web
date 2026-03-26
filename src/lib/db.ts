import Dexie, { type Table } from 'dexie';

export interface DbRoom {
  id: string;
  type: 'dm' | 'group' | 'channel' | 'broadcast';
  lastActiveAt: number; // epoch ms
  archived: number;     // 1 = archived, 0 = not (number for Dexie indexing)
  wallpaper?: string;
}

export interface DbDm {
  id?: number;          // auto-increment
  roomId: string;
  subscriberId: string;
}

export interface DbSubscriber {
  id: string;           // server UUID
  phoneNumber: string;
  name: string | null;
  avatar?: string;
  inContact: number;    // 1 = true, 0 = false (Dexie indexes work better with numbers)
  isBlocked: number;    // 1 = blocked, 0 = not
  lastSeenAt?: number;  // epoch ms — undefined means never seen / unknown
}

export interface DbGroup {
  id: string;           // server UUID
  name: string;
  createdBy: string;
  createdAt: number;
  ownedBy: string;
  ownedAt: number;
  roomId: string;
}

export interface DbGroupMember {
  id?: number;
  groupId: string;
  subscriberId: string;
  phoneNumber: string;
  role: 'admin' | 'member';
}

export interface DbChannel {
  id: string;           // server UUID
  name: string;
  logo?: string;
  roomId: string;
}

export interface DbMessage {
  id: string;           // ULID
  roomId: string;
  sentBy: string | null; // null = system message
  content: string;      // JSON stringified MessageContent
  type: 'text' | 'file' | 'sticker' | 'info';
  sentAt: number;       // epoch ms
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  replyTo?: string;
  receipts?: string;    // JSON stringified receipt map
}

class AppDb extends Dexie {
  rooms!: Table<DbRoom, string>;
  dms!: Table<DbDm, number>;
  subscribers!: Table<DbSubscriber, string>;
  groups!: Table<DbGroup, string>;
  groupMembers!: Table<DbGroupMember, number>;
  channels!: Table<DbChannel, string>;
  messages!: Table<DbMessage, string>;

  constructor() {
    super('whatsapp_db');
    this.version(1).stores({
      rooms:        'id, type, lastActiveAt',
      dms:          '++id, roomId, subscriberId',
      subscribers:  'id, phoneNumber, inContact',
      groups:       'id, roomId',
      groupMembers: '++id, groupId, subscriberId',
      channels:     'id, roomId',
      messages:     'id, roomId, sentAt, type, status',
    });
    // v2: archived on rooms, isBlocked on subscribers
    this.version(2).stores({
      rooms:       'id, type, lastActiveAt, archived',
      subscribers: 'id, phoneNumber, inContact, isBlocked',
    }).upgrade((tx) => {
      tx.table('rooms').toCollection().modify((r) => { r.archived = 0; });
      tx.table('subscribers').toCollection().modify((s) => { s.isBlocked = 0; });
    });
  }
}

export const db = new AppDb();
