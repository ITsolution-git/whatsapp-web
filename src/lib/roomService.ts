import { db, type DbMessage } from './db';
import { type MessageContent } from './messageContent';

export async function getOrCreateDmRoom(subscriberId: string): Promise<string> {
  const existing = await db.dms.where('subscriberId').equals(subscriberId).first();
  if (existing) return existing.roomId;

  const roomId = crypto.randomUUID();
  await db.transaction('rw', db.rooms, db.dms, async () => {
    await db.rooms.put({ id: roomId, type: 'dm', lastActiveAt: Date.now(), archived: 0 });
    await db.dms.add({ roomId, subscriberId });
  });
  return roomId;
}

export async function setRoomArchived(roomId: string, archived: boolean): Promise<void> {
  await db.rooms.update(roomId, { archived: archived ? 1 : 0 });
}

export async function setSubscriberBlocked(subscriberId: string, blocked: boolean): Promise<void> {
  await db.subscribers.update(subscriberId, { isBlocked: blocked ? 1 : 0 });
}

export async function upsertSubscriber(
  sub: { id: string; phoneNumber: string; name: string | null; lastSeenAt?: number },
  inContact = false,
): Promise<void> {
  const existing = await db.subscribers.get(sub.id);
  if (existing) {
    await db.subscribers.update(sub.id, {
      phoneNumber: sub.phoneNumber || existing.phoneNumber,
      name: sub.name ?? existing.name,
      inContact: inContact ? 1 : existing.inContact,
      ...(sub.lastSeenAt !== undefined && { lastSeenAt: sub.lastSeenAt }),
    });
  } else {
    await db.subscribers.put({ ...sub, inContact: inContact ? 1 : 0, isBlocked: 0 });
  }
}

export async function saveMessage(params: {
  id: string;
  roomId: string;
  sentBy: string | null;
  content: MessageContent;
  sentAt: number;
  status: DbMessage['status'];
  replyTo?: string;
}): Promise<void> {
  await db.messages.put({
    ...params,
    content: JSON.stringify(params.content),
    type: params.content.type,
  });
  await db.rooms.update(params.roomId, { lastActiveAt: params.sentAt });
}

export async function updateMessageStatus(
  messageId: string,
  status: DbMessage['status'],
): Promise<void> {
  await db.messages.update(messageId, { status });
}
