import { useState } from 'react'
import { ArrowLeft, MoreVertical, Search, Users2, UserPlus, Building2, User } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../lib/db'
import { getOrCreateDmRoom } from '../../lib/roomService'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/cn'
import type { DbSubscriber } from '../../lib/db'

interface NewChatSidebarProps {
  onBack: () => void
  onNewContact: () => void
  onSelectRoom: (roomId: string) => void
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

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return phone.slice(-2)
}

export default function NewChatSidebar({ onBack, onNewContact, onSelectRoom }: NewChatSidebarProps) {
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState<string | null>(null)

  const contacts = useLiveQuery(
    () => db.subscribers.where('inContact').equals(1).toArray(),
    []
  ) ?? []

  async function handleSelectContact(sub: DbSubscriber) {
    setCreating(sub.id)
    try {
      const roomId = await getOrCreateDmRoom(sub.id)
      onSelectRoom(roomId)
    } catch (err) {
      console.error('Failed to open DM', err)
    } finally {
      setCreating(null)
    }
  }

  const filtered = contacts.filter((c) => {
    const name = c.name ?? c.phoneNumber
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
    )
  })

  // Group by first letter
  const grouped: Record<string, DbSubscriber[]> = {}
  filtered.forEach((c) => {
    const name = c.name ?? c.phoneNumber
    const letter = name[0].toUpperCase()
    const key = /[A-Z]/.test(letter) ? letter : '#'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  })
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="flex flex-col h-full" style={{ background: '#111b21' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#202c33' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
            style={{ color: '#aebac1' }}
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium text-base" style={{ color: '#e9edef' }}>
            New chat
          </span>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
          style={{ color: '#aebac1' }}
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 flex-shrink-0" style={{ background: '#111b21' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full"
          style={{ background: '#2a3942', border: '1px solid #00a884' }}
        >
          <Search size={16} style={{ color: '#00a884' }} />
          <input
            type="text"
            placeholder="Search name or number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8696a0]"
            style={{ color: '#e9edef' }}
            autoFocus
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: '#2a3942' }}>
        <ActionRow icon={<Users2 size={20} />} label="New group" onClick={() => {}} />
        <ActionRow icon={<UserPlus size={20} />} label="New contact" onClick={onNewContact} />
        <ActionRow icon={<Building2 size={20} />} label="New community" onClick={() => {}} />
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {/* Current user row */}
        {currentUser && (
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer">
            <div
              className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: '#2a3942' }}
            >
              <User size={22} style={{ color: '#8696a0' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#e9edef' }}>
                {currentUser.name ?? currentUser.phoneNumber}{' '}
                <span style={{ color: '#00a884' }}>(You)</span>
              </p>
              <p className="text-xs" style={{ color: '#8696a0' }}>
                Message yourself
              </p>
            </div>
          </div>
        )}

        {sortedKeys.map((letter) => (
          <div key={letter}>
            <div className="px-4 py-1">
              <span className="text-xs font-medium" style={{ color: '#00a884' }}>
                {letter}
              </span>
            </div>
            {grouped[letter].map((sub) => {
              const name = sub.name ?? sub.phoneNumber
              const initials = getInitials(sub.name, sub.phoneNumber)
              const isLoading = creating === sub.id

              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectContact(sub)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors',
                    isLoading && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                    style={{ background: getAvatarColor(sub.id), color: '#fff' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#e9edef' }}>
                      {name}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#8696a0' }}>
                      {sub.phoneNumber}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
            <p className="text-sm" style={{ color: '#8696a0' }}>
              No contacts yet
            </p>
            <button
              onClick={onNewContact}
              className="text-sm"
              style={{ color: '#00a884' }}
            >
              Add a contact
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[#202c33] transition-colors"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#00a884' }}
      >
        <span style={{ color: '#111b21' }}>{icon}</span>
      </div>
      <span className="text-sm font-medium" style={{ color: '#e9edef' }}>
        {label}
      </span>
    </div>
  )
}
