import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { connectSocket, disconnectSocket, on, off, onOpen, send as socketSend } from '../lib/socket';
import { db } from '../lib/db';
import { getOrCreateDmRoom, upsertSubscriber, saveMessage, updateMessageStatus } from '../lib/roomService';
import { parseContent } from '../lib/messageContent';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import type { UiRoom, WireMessageReceived, PresenceMap } from '../types';

interface ChatContextType {
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  rooms: UiRoom[];
  presence: PresenceMap;
}

const ChatContext = createContext<ChatContextType>({
  activeRoomId: null,
  setActiveRoomId: () => {},
  rooms: [],
  presence: {},
});

// Fetch all pending deliveries from REST API (paginated), save to IndexedDB, then ack
async function syncPendingMessages(
  deviceId: string,
  currentUserId: string,
  onDelivered: (messageId: string, roomId: string) => void,
) {
  let cursor: string | undefined;
  do {
    const res = await api.getPendingMessages(deviceId, cursor);
    const { items, nextCursor } = res;
    if (items.length === 0) break;

    for (const row of items) {
      if (row.message) {
        const msg = row.message;
        const content = parseContent(msg.content);

        let roomId: string | null = null;
        if (msg.targetType === 'dm') {
          const otherSubscriberId =
            msg.senderId === currentUserId ? msg.targetId : msg.senderId;
          await upsertSubscriber({ id: msg.senderId, phoneNumber: '', name: null }, false);
          roomId = await getOrCreateDmRoom(otherSubscriberId);
        } else if (msg.targetType === 'group') {
          const group = await db.groups.get(msg.targetId);
          roomId = group?.roomId ?? null;
        }

        if (roomId) {
          await saveMessage({
            id: msg.id,
            roomId,
            sentBy: msg.senderId,
            content,
            sentAt: new Date(msg.sentAt).getTime(),
            status: msg.senderId === currentUserId ? 'sent' : 'delivered',
          });
          // Auto-fire delivery/seen receipt for messages from others
          if (msg.senderId !== currentUserId) {
            onDelivered(msg.id, roomId);
          }
        }
      } else if (row.payload) {
        // Receipt event (message_delivered / message_seen)
        const payload = row.payload as { event: string; data: { messageId: string } };
        if (payload.event === 'message_delivered' || payload.event === 'message_seen') {
          const status = payload.event === 'message_seen' ? 'seen' : 'delivered';
          await updateMessageStatus(payload.data.messageId, status);
        }
      }
    }

    // Ack processed items
    await api.ackPendingMessages(deviceId, items.map((r: any) => r.id));

    cursor = nextCursor ?? undefined;
  } while (cursor);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, token, deviceId } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const [presence, setPresence] = useState<PresenceMap>({});

  // Reactive room list from IndexedDB
  const rawRooms = useLiveQuery(() =>
    db.rooms.orderBy('lastActiveAt').reverse().toArray()
  ) ?? [];

  // Watch subscribers so that name/contact/block changes re-trigger room building
  const rawSubscribers = useLiveQuery(() => db.subscribers.toArray()) ?? [];

  // Watch delivered-message IDs so buildRooms re-runs when any message is marked seen
  // (saveMessage already touches rooms.lastActiveAt which updates rawRooms, but
  //  updateMessageStatus only touches messages — this closes the gap)
  const rawUnreadKeys = useLiveQuery(() =>
    db.messages.where('status').equals('delivered').primaryKeys()
  ) ?? [];

  const [rooms, setRooms] = useState<UiRoom[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function buildRooms() {
      const built = await Promise.all(
        rawRooms.map(async (room) => {
          let displayName = 'Unknown';
          let subscriberId: string | undefined;
          let isBlocked = false;
          if (room.type === 'dm') {
            const dm = await db.dms.where('roomId').equals(room.id).first();
            const sub = dm ? await db.subscribers.get(dm.subscriberId) : null;
            displayName = sub?.name ?? sub?.phoneNumber ?? 'Unknown';
            subscriberId = dm?.subscriberId;
            isBlocked = sub?.isBlocked === 1;
          } else if (room.type === 'group') {
            const group = await db.groups.get(room.id);
            displayName = group?.name ?? 'Group';
          } else if (room.type === 'channel') {
            const channel = await db.channels.get(room.id);
            displayName = channel?.name ?? 'Channel';
          }
          const lastMsgRow = await db.messages
            .where('roomId').equals(room.id)
            .last();
          const unreadCount = await db.messages
            .where('roomId').equals(room.id)
            .filter((m) => m.sentBy !== currentUser?.id && m.status !== 'seen')
            .count();

          return {
            id: room.id,
            type: room.type,
            displayName,
            subscriberId,
            archived: room.archived === 1,
            isBlocked,
            lastActiveAt: room.lastActiveAt,
            lastMessage: lastMsgRow
              ? {
                  id: lastMsgRow.id,
                  roomId: lastMsgRow.roomId,
                  sentBy: lastMsgRow.sentBy,
                  content: parseContent(lastMsgRow.content),
                  type: lastMsgRow.type,
                  sentAt: new Date(lastMsgRow.sentAt),
                  status: lastMsgRow.status,
                  isOwn: lastMsgRow.sentBy === currentUser?.id,
                }
              : undefined,
            unreadCount,
          } satisfies UiRoom;
        }),
      );
      if (!cancelled) setRooms(built);
    }
    buildRooms();
    return () => { cancelled = true; };
  }, [rawRooms, rawSubscribers, rawUnreadKeys, currentUser?.id]);

  // Keep ref in sync so socket callbacks can read current activeRoomId without stale closure
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // Mark all delivered messages in a room as seen when user opens it
  useEffect(() => {
    if (!activeRoomId || !currentUser) return;
    db.messages
      .where('roomId').equals(activeRoomId)
      .filter((m) => m.sentBy !== currentUser.id && m.status === 'delivered')
      .toArray()
      .then((msgs) => {
        if (msgs.length === 0) return;
        const now = new Date().toISOString();
        for (const msg of msgs) {
          updateMessageStatus(msg.id, 'seen');
          socketSend('message_seen', { messageId: msg.id, at: now });
        }
      });
  }, [activeRoomId, currentUser]);

  // Socket lifecycle + pending sync on open
  useEffect(() => {
    if (!token || !currentUser) return;

    // 1. Fetch missed messages via REST (paginated) before connecting socket
    //    Delivery receipts are buffered by socket.send() and flushed once socket opens
    syncPendingMessages(deviceId, currentUser.id, (messageId, roomId) => {
      const event = roomId === activeRoomIdRef.current ? 'message_seen' : 'message_delivered';
      socketSend(event, { messageId, at: new Date().toISOString() });
    }).catch((err) =>
      console.error('[ChatContext] syncPendingMessages failed', err),
    );

    // 2. Connect socket for real-time events going forward
    connectSocket(token, deviceId);

    const handleMessageReceived = async (raw: unknown) => {
      const data = raw as WireMessageReceived;
      const content = parseContent(data.content);

      let roomId: string | null = null;
      if (data.targetType === 'dm') {
        const otherSubscriberId =
          data.senderId === currentUser.id ? data.targetId : data.senderId;
        await upsertSubscriber({ id: data.senderId, phoneNumber: '', name: null }, false);
        roomId = await getOrCreateDmRoom(otherSubscriberId);
      } else if (data.targetType === 'group') {
        const group = await db.groups.get(data.targetId);
        roomId = group?.roomId ?? null;
      }

      if (!roomId) return;

      const isFromOther = data.senderId !== currentUser.id;
      const isActiveRoom = roomId === activeRoomIdRef.current;
      const incomingStatus = !isFromOther ? 'sent' : isActiveRoom ? 'seen' : 'delivered';

      await saveMessage({
        id: data.messageId,
        roomId,
        sentBy: data.senderId,
        content,
        sentAt: new Date(data.sentAt).getTime(),
        status: incomingStatus,
      });

      if (isFromOther) {
        const now = new Date().toISOString();
        if (isActiveRoom) {
          socketSend('message_seen', { messageId: data.messageId, at: now });
        } else {
          socketSend('message_delivered', { messageId: data.messageId, at: now });
        }
      }
    };

    const handleMessageAck = (raw: unknown) => {
      const { messageId } = raw as { messageId: string };
      updateMessageStatus(messageId, 'sent');
    };

    const handleMessageDelivered = (raw: unknown) => {
      const { messageId } = raw as { messageId: string };
      updateMessageStatus(messageId, 'delivered');
    };

    const handleMessageSeen = (raw: unknown) => {
      const { messageId } = raw as { messageId: string };
      updateMessageStatus(messageId, 'seen');
    };

    const handlePresenceUpdate = (raw: unknown) => {
      const { subscriberId, online, lastSeenAt } = raw as {
        subscriberId: string;
        online: boolean;
        lastSeenAt?: string;
      };
      const lastSeenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : undefined;
      setPresence((prev) => ({
        ...prev,
        [subscriberId]: { online, ...(lastSeenMs !== undefined && { lastSeenAt: lastSeenMs }) },
      }));
      if (lastSeenMs !== undefined) {
        upsertSubscriber({ id: subscriberId, phoneNumber: '', name: null, lastSeenAt: lastSeenMs });
      }
    };

    const handlePresenceBulk = (raw: unknown) => {
      const { statuses } = raw as {
        statuses: Record<string, { online: boolean; lastSeenAt?: string }>;
      };
      const updates: PresenceMap = {};
      for (const [id, entry] of Object.entries(statuses)) {
        const lastSeenMs = entry.lastSeenAt ? new Date(entry.lastSeenAt).getTime() : undefined;
        updates[id] = { online: entry.online, ...(lastSeenMs !== undefined && { lastSeenAt: lastSeenMs }) };
        if (lastSeenMs !== undefined) {
          upsertSubscriber({ id, phoneNumber: '', name: null, lastSeenAt: lastSeenMs });
        }
      }
      setPresence((prev) => ({ ...prev, ...updates }));
    };

    on('message_received', handleMessageReceived);
    on('message_ack', handleMessageAck);
    on('message_delivered', handleMessageDelivered);
    on('message_seen', handleMessageSeen);
    on('presence_update', handlePresenceUpdate);
    on('presence_bulk', handlePresenceBulk);

    // Re-subscribe to presence on every (re)connect so presence works after reconnects
    const subscribePresence = () => {
      db.subscribers.where('inContact').equals(1).toArray().then((contacts) => {
        if (contacts.length === 0) return;
        socketSend('subscribe_presence', { subscriberIds: contacts.map((c) => c.id) });
      });
    };
    const removeOpenListener = onOpen(subscribePresence);

    return () => {
      off('message_received', handleMessageReceived);
      off('message_ack', handleMessageAck);
      off('message_delivered', handleMessageDelivered);
      off('message_seen', handleMessageSeen);
      off('presence_update', handlePresenceUpdate);
      off('presence_bulk', handlePresenceBulk);
      removeOpenListener();
      disconnectSocket();
    };
  }, [token, currentUser, deviceId]);

  return (
    <ChatContext.Provider value={{ activeRoomId, setActiveRoomId, rooms, presence }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextType {
  return useContext(ChatContext);
}
