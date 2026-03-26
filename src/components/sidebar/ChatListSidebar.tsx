import { useState } from 'react'
import { Search, SquarePen, MoreVertical, Archive, Lock, ArrowLeft } from 'lucide-react'
import { useChatContext } from '../../contexts/ChatContext'
import { setRoomArchived } from '../../lib/roomService'
import { cn } from '../../lib/cn'
import type { UiRoom } from '../../types'

interface ChatListSidebarProps {
  activeRoomId: string | null
  onSelectRoom: (roomId: string) => void
  onNewChat: () => void
}

type FilterType = 'all' | 'unread' | 'favorites' | 'groups'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0][0] ?? '?').toUpperCase()
}

function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const AVATAR_COLORS = [
  '#00a884', '#128c7e', '#075e54', '#25d366', '#34b7f1',
  '#5b6e74', '#6b7c85', '#3b5e6e'
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getLastMessagePreview(room: UiRoom): string {
  if (!room.lastMessage) return ''
  const { content } = room.lastMessage
  if (content.type === 'text') return content.body
  if (content.type === 'file') return `📎 ${content.name}`
  if (content.type === 'sticker') return '🎭 Sticker'
  if (content.type === 'info') return content.body
  return ''
}

export default function ChatListSidebar({ activeRoomId, onSelectRoom, onNewChat }: ChatListSidebarProps) {
  const { rooms, presence } = useChatContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [showArchived, setShowArchived] = useState(false)

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'groups', label: 'Groups' },
  ]

  // Split rooms: blocked never show, archived only in archived view, active only in main view
  const activeRooms = rooms.filter((r) => !r.isBlocked && !r.archived)
  const archivedRooms = rooms.filter((r) => !r.isBlocked && r.archived)

  const visibleRooms = showArchived ? archivedRooms : activeRooms

  const filteredRooms = visibleRooms.filter((room) => {
    const matchesSearch = room.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (activeFilter === 'unread') return (room.unreadCount ?? 0) > 0
    if (activeFilter === 'groups') return room.type === 'group'
    return true
  })

  return (
    <div className="flex flex-col h-full" style={{ background: '#111b21' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#202c33' }}>
        {showArchived ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowArchived(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
                style={{ color: '#aebac1' }}
              >
                <ArrowLeft size={20} />
              </button>
              <span className="font-semibold text-base" style={{ color: '#e9edef' }}>Archived</span>
            </div>
          </>
        ) : (
          <>
            <span className="font-semibold text-base" style={{ color: '#e9edef' }}>WhatsApp</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewChat}
                title="New chat"
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#2a3942]"
                style={{ color: '#aebac1' }}
              >
                <SquarePen size={20} />
              </button>
              <button
                title="Menu"
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#2a3942]"
                style={{ color: '#aebac1' }}
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 flex-shrink-0" style={{ background: '#111b21' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{ background: '#2a3942' }}
        >
          <Search size={16} style={{ color: '#8696a0' }} />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8696a0]"
            style={{ color: '#e9edef' }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-3 pb-2 flex-shrink-0 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors',
              activeFilter === f.key
                ? 'text-[#111b21]'
                : 'text-[#8696a0] hover:bg-[#2a3942]'
            )}
            style={
              activeFilter === f.key
                ? { background: '#00a884', border: '1px solid #00a884' }
                : { background: '#2a3942', border: '1px solid transparent' }
            }
          >
            {f.label}
          </button>
        ))}
        <button
          className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 hover:bg-[#2a3942] transition-colors"
          style={{ background: '#2a3942', color: '#8696a0', border: '1px solid transparent' }}
        >
          New list
        </button>
      </div>

      {/* Archived row — only in main view and if there are archived chats */}
      {!showArchived && archivedRooms.length > 0 && (
        <div
          onClick={() => setShowArchived(true)}
          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#2a3942] flex-shrink-0"
          style={{ borderBottom: '1px solid #2a3942' }}
        >
          <Archive size={16} style={{ color: '#8696a0' }} />
          <span className="text-sm flex-1" style={{ color: '#8696a0' }}>Archived</span>
          <span className="text-xs font-medium" style={{ color: '#00a884' }}>{archivedRooms.length}</span>
        </div>
      )}

      {/* Room list — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm" style={{ color: '#8696a0' }}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isActive = room.id === activeRoomId
            const initials = getInitials(room.displayName)
            const preview = getLastMessagePreview(room)
            const time = room.lastMessage?.sentAt ?? new Date(room.lastActiveAt)
            const isOnline = room.type === 'dm' && room.subscriberId
              ? presence[room.subscriberId]?.online === true
              : false

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setRoomArchived(room.id, !room.archived)
                }}
                title={room.archived ? 'Right-click to unarchive' : 'Right-click to archive'}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative',
                  isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                )}
                style={isActive ? { borderLeft: '3px solid #00a884' } : { borderLeft: '3px solid transparent' }}
              >
                {/* Avatar with presence dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ background: getAvatarColor(room.id), color: '#fff' }}
                  >
                    {initials}
                  </div>
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{ background: '#25d366', borderColor: '#111b21' }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-sm truncate" style={{ color: '#e9edef' }}>
                      {room.displayName}
                    </span>
                    <span className="text-xs flex-shrink-0 ml-2" style={{ color: '#8696a0' }}>
                      {formatTime(time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate" style={{ color: '#8696a0' }}>
                      {preview}
                    </span>
                    {(room.unreadCount ?? 0) > 0 && (
                      <div
                        className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1 flex-shrink-0 ml-2"
                        style={{ background: '#00a884', color: '#111b21' }}
                      >
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom encryption notice */}
      <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0" style={{ borderTop: '1px solid #1f2c34' }}>
        <Lock size={11} style={{ color: '#8696a0' }} />
        <span className="text-[11px]" style={{ color: '#8696a0' }}>
          Your personal messages are{' '}
          <span style={{ color: '#8696a0', textDecoration: 'underline', cursor: 'pointer' }}>
            end-to-end encrypted
          </span>
        </span>
      </div>
    </div>
  )
}
