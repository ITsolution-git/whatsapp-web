import { useState } from 'react'
import {
  Search, User, Key, Shield, MessageSquare, Bell, Keyboard,
  HelpCircle, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SettingsRow {
  icon: React.ReactNode
  title: string
  subtitle: string
  danger?: boolean
  onClick?: () => void
}

function SettingsItem({ icon, title, subtitle, danger, onClick }: SettingsRow) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#2a3942] transition-colors"
    >
      <div style={{ color: danger ? '#ea2121' : '#8696a0', flexShrink: 0 }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: danger ? '#ea2121' : '#e9edef' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs truncate" style={{ color: '#8696a0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {!danger && <ChevronRight size={16} style={{ color: '#8696a0', flexShrink: 0 }} />}
    </div>
  )
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return phone.slice(-2)
}

export default function SettingsSidebar() {
  const { currentUser, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const items: SettingsRow[] = [
    {
      icon: <User size={22} />,
      title: 'Profile',
      subtitle: 'Name, profile photo, username',
    },
    {
      icon: <Key size={22} />,
      title: 'Account',
      subtitle: 'Security notifications, account info',
    },
    {
      icon: <Shield size={22} />,
      title: 'Privacy',
      subtitle: 'Blocked contacts, disappearing messages',
    },
    {
      icon: <MessageSquare size={22} />,
      title: 'Chats',
      subtitle: 'Theme, wallpaper, chat settings',
    },
    {
      icon: <Bell size={22} />,
      title: 'Notifications',
      subtitle: 'Messages, groups, sounds',
    },
    {
      icon: <Keyboard size={22} />,
      title: 'Keyboard shortcuts',
      subtitle: 'Quick actions',
    },
    {
      icon: <HelpCircle size={22} />,
      title: 'Help and feedback',
      subtitle: 'Help center, contact us, privacy policy',
    },
    {
      icon: <LogOut size={22} />,
      title: 'Log out',
      subtitle: '',
      danger: true,
      onClick: logout,
    },
  ]

  const filtered = searchQuery
    ? items.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : items

  return (
    <div className="flex flex-col h-full" style={{ background: '#111b21' }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex-shrink-0" style={{ background: '#202c33' }}>
        <h2 className="text-xl font-medium mb-4" style={{ color: '#e9edef' }}>
          Settings
        </h2>
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full mb-4"
          style={{ background: '#2a3942' }}
        >
          <Search size={16} style={{ color: '#8696a0' }} />
          <input
            type="text"
            placeholder="Search settings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8696a0]"
            style={{ color: '#e9edef' }}
          />
        </div>

        {/* Profile card */}
        {currentUser && (
          <div className="flex items-center gap-4 pb-4 cursor-pointer hover:bg-[#2a3942] rounded-lg px-2 py-2 transition-colors -mx-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0"
              style={{ background: '#2a3942', color: '#e9edef' }}
            >
              {getInitials(currentUser.name, currentUser.phoneNumber)}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate" style={{ color: '#e9edef' }}>
                {currentUser.name ?? 'No name set'}
              </p>
              <p className="text-sm" style={{ color: '#8696a0' }}>
                {currentUser.phoneNumber}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: '#8696a0', flexShrink: 0 }} className="ml-auto" />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-2 flex-shrink-0" style={{ background: '#0b141a' }} />

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#111b21' }}>
        {filtered.map((item) => (
          <SettingsItem key={item.title} {...item} />
        ))}
      </div>
    </div>
  )
}
