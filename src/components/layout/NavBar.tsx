import { MessageSquare, CircleDot, Hash, Users, Image, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/cn'

type NavView = 'chats' | 'new-chat' | 'new-contact' | 'settings'

interface NavBarProps {
  activeView: NavView
  onViewChange: (view: NavView) => void
}

function getInitials(name: string | null, phone: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return phone ? phone.slice(-2) : '?'
}

interface NavIconProps {
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
  title?: string
}

function NavIcon({ icon, active, onClick, title }: NavIconProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
        active ? 'text-[#00a884]' : 'text-[#aebac1] hover:bg-[#2a3942]'
      )}
    >
      {icon}
    </button>
  )
}

export default function NavBar({ activeView, onViewChange }: NavBarProps) {
  const { currentUser } = useAuth()

  return (
    <div
      className="w-[60px] flex flex-col items-center justify-between py-3 flex-shrink-0 border-r"
      style={{ background: '#111b21', borderColor: '#2a3942' }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center gap-1">
        <NavIcon
          icon={<MessageSquare size={22} />}
          active={activeView === 'chats'}
          onClick={() => onViewChange('chats')}
          title="Chats"
        />
        <NavIcon
          icon={<CircleDot size={22} />}
          title="Status"
        />
        <NavIcon
          icon={<Hash size={22} />}
          title="Channels"
        />
        <NavIcon
          icon={<Users size={22} />}
          title="Communities"
        />
        {/* Meta AI — styled circle */}
        <button
          title="Meta AI"
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors text-[#aebac1] hover:bg-[#2a3942]"
        >
          <div
            className="w-[22px] h-[22px] rounded-full"
            style={{
              background: 'linear-gradient(135deg, #0668E1 0%, #7B5BDE 50%, #E91E8C 100%)',
            }}
          />
        </button>
        <NavIcon
          icon={<Image size={22} />}
          title="Media"
        />
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-2">
        <NavIcon
          icon={<Settings size={22} />}
          active={activeView === 'settings'}
          onClick={() => onViewChange('settings')}
          title="Settings"
        />
        {/* User avatar */}
        <button
          title={currentUser?.name ?? currentUser?.phoneNumber ?? 'You'}
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
          style={{ background: '#2a3942', color: '#e9edef' }}
        >
          {currentUser
            ? getInitials(currentUser.name, currentUser.phoneNumber)
            : '?'}
        </button>
      </div>
    </div>
  )
}
