import { ulid } from 'ulid'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { UserPlus, Ban, X } from 'lucide-react'
import { send as socketSend } from '../../lib/socket'
import { db } from '../../lib/db'
import { saveMessage, upsertSubscriber, setSubscriberBlocked, setRoomArchived } from '../../lib/roomService'
import { textContent, parseContent } from '../../lib/messageContent'
import { useAuth } from '../../contexts/AuthContext'
import { useChatContext } from '../../contexts/ChatContext'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import type { UiMessage } from '../../types'

interface ChatAreaProps {
  roomId: string
}

export default function ChatArea({ roomId }: ChatAreaProps) {
  const { currentUser } = useAuth()
  const { rooms } = useChatContext()

  const room = rooms.find((r) => r.id === roomId)
  const displayName = room?.displayName ?? 'Chat'

  const rawMessages = useLiveQuery(
    () => db.messages.where('roomId').equals(roomId).sortBy('sentAt'),
    [roomId]
  ) ?? []

  const dmEntry = useLiveQuery(
    () => db.dms.where('roomId').equals(roomId).first(),
    [roomId]
  )

  const dmSubscriber = useLiveQuery(
    () => dmEntry ? db.subscribers.get(dmEntry.subscriberId) : undefined,
    [dmEntry?.subscriberId]
  )

  const isUnknown = room?.type === 'dm' && dmSubscriber !== undefined && dmSubscriber.inContact === 0 && dmSubscriber.isBlocked === 0
  const isBlocked = room?.type === 'dm' && dmSubscriber?.isBlocked === 1

  // Modal state for "Add contact"
  const [showAddModal, setShowAddModal] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const messages: UiMessage[] = rawMessages.map((m) => ({
    id: m.id,
    roomId: m.roomId,
    sentBy: m.sentBy,
    content: parseContent(m.content),
    type: m.type,
    sentAt: new Date(m.sentAt),
    status: m.status,
    isOwn: m.sentBy === currentUser?.id,
    replyTo: m.replyTo,
  }))

  const sendDisabled = isBlocked || room?.archived === true

  async function handleSend(body: string) {
    if (!currentUser || sendDisabled) return

    const messageId = ulid()
    const sentAt = Date.now()
    const content = textContent(body)

    await saveMessage({
      id: messageId,
      roomId,
      sentBy: currentUser.id,
      content,
      sentAt,
      status: 'sending',
    })

    const targetId = dmEntry?.subscriberId ?? roomId

    socketSend('send_message', {
      messageId,
      targetType: room?.type ?? 'dm',
      targetId,
      content,
      sentAt: new Date(sentAt).toISOString(),
    })
  }

  function openAddModal() {
    // Pre-fill name from existing subscriber data if available
    const parts = (dmSubscriber?.name ?? '').trim().split(' ')
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' '))
    setShowAddModal(true)
  }

  async function handleSaveContact() {
    if (!dmSubscriber) return
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null
    await upsertSubscriber(
      { id: dmSubscriber.id, phoneNumber: dmSubscriber.phoneNumber, name },
      true,
    )
    socketSend('subscribe_presence', { subscriberIds: [dmSubscriber.id] })
    setShowAddModal(false)
    setFirstName('')
    setLastName('')
  }

  async function handleBlock() {
    if (!dmSubscriber) return
    await setSubscriberBlocked(dmSubscriber.id, true)
  }

  async function handleUnblock() {
    if (!dmSubscriber) return
    await setSubscriberBlocked(dmSubscriber.id, false)
  }

  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader roomId={roomId} displayName={displayName} subscriberId={room?.subscriberId} />

      {/* Unknown contact banner */}
      {isUnknown && (
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 text-sm"
          style={{ background: '#182229', borderBottom: '1px solid #2a3942' }}
        >
          <span style={{ color: '#8696a0' }}>
            {dmSubscriber?.phoneNumber
              ? `${dmSubscriber.phoneNumber} is not in your contacts`
              : 'This person is not in your contacts'}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-90"
              style={{ background: '#00a884', color: '#111b21' }}
            >
              <UserPlus size={13} />
              Add contact
            </button>
            <button
              onClick={handleBlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: '#2a3942', color: '#8696a0' }}
            >
              <Ban size={13} />
              Block
            </button>
          </div>
        </div>
      )}

      {/* Blocked banner */}
      {isBlocked && (
        <div
          className="flex items-center justify-center gap-3 px-4 py-2.5 flex-shrink-0 text-sm"
          style={{ background: '#182229', borderBottom: '1px solid #2a3942' }}
        >
          <span style={{ color: '#8696a0' }}>You blocked this contact</span>
          <button
            onClick={handleUnblock}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: '#2a3942', color: '#00a884' }}
          >
            Unblock
          </button>
        </div>
      )}

      <MessageList messages={messages} />
      {room?.archived && (
        <div
          className="flex items-center justify-center gap-3 px-4 py-2.5 flex-shrink-0 text-sm"
          style={{ background: '#182229', borderTop: '1px solid #2a3942' }}
        >
          <span style={{ color: '#8696a0' }}>This chat is archived</span>
          <button
            onClick={() => setRoomArchived(roomId, false)}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: '#2a3942', color: '#00a884' }}
          >
            Unarchive
          </button>
        </div>
      )}
      {!room?.archived && <MessageInput onSend={handleSend} disabled={sendDisabled} />}

      {/* Add contact modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-80 rounded-xl shadow-2xl p-6" style={{ background: '#202c33' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base" style={{ color: '#e9edef' }}>Add contact</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#8696a0' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: '#8696a0' }}>
              {dmSubscriber?.phoneNumber}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8696a0' }}>First name</label>
                <input
                  autoFocus
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveContact()}
                  placeholder="First name"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none placeholder:text-[#4a5568]"
                  style={{ background: '#2a3942', color: '#e9edef', border: '1px solid #374045' }}
                  onFocus={(e) => (e.target.style.borderColor = '#00a884')}
                  onBlur={(e) => (e.target.style.borderColor = '#374045')}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8696a0' }}>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveContact()}
                  placeholder="Last name (optional)"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none placeholder:text-[#4a5568]"
                  style={{ background: '#2a3942', color: '#e9edef', border: '1px solid #374045' }}
                  onFocus={(e) => (e.target.style.borderColor = '#00a884')}
                  onBlur={(e) => (e.target.style.borderColor = '#374045')}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#2a3942', color: '#8696a0' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                disabled={!firstName.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: '#00a884', color: '#111b21' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
