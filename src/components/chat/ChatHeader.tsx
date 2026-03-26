import { Search, MoreVertical } from 'lucide-react'
import { useChatContext } from '../../contexts/ChatContext'

interface ChatHeaderProps {
  roomId: string
  displayName: string
  subscriberId?: string // only for DM rooms
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0][0] ?? '?').toUpperCase()
}

const AVATAR_COLORS = [
  '#00a884', '#128c7e', '#075e54', '#3b5e6e',
  '#6b7c85', '#5b6e74', '#34b7f1', '#25d366'
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatLastSeen(epochMs: number): string {
  const diff = Date.now() - epochMs
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'last seen just now'
  if (minutes < 60) return `last seen ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24) return `last seen ${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days === 1) return 'last seen yesterday'
  if (days < 7) return `last seen ${days} days ago`
  return `last seen ${new Date(epochMs).toLocaleDateString()}`
}

export default function ChatHeader({ roomId, displayName, subscriberId }: ChatHeaderProps) {
  const { presence } = useChatContext()
  const initials = getInitials(displayName)

  const presenceEntry = subscriberId ? presence[subscriberId] : undefined
  const statusLine = presenceEntry?.online
    ? 'Online'
    : presenceEntry?.lastSeenAt
    ? formatLastSeen(presenceEntry.lastSeenAt)
    : null

  return (
    <div
      className="flex items-center justify-between px-4 h-[60px] flex-shrink-0"
      style={{ background: '#202c33', borderBottom: '1px solid #2a3942' }}
    >
      {/* Left: avatar + info */}
      <div className="flex items-center gap-3 cursor-pointer">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
          style={{ background: getAvatarColor(roomId), color: '#fff' }}
        >
          {initials}
        </div>
        <div>
          <p className="font-medium text-sm leading-tight" style={{ color: '#e9edef' }}>
            {displayName}
          </p>
          {statusLine && (
            <p className="text-xs leading-tight" style={{ color: presenceEntry?.online ? '#00a884' : '#8696a0' }}>
              {statusLine}
            </p>
          )}
        </div>
      </div>

      {/* Right: action icons */}
      <div className="flex items-center gap-1">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
          style={{ color: '#aebac1' }}
          title="Search"
        >
          <Search size={20} />
        </button>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
          style={{ color: '#aebac1' }}
          title="Menu"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  )
}
