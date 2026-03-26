import { useState } from 'react'
import NavBar from './NavBar'
import ChatListSidebar from '../sidebar/ChatListSidebar'
import NewChatSidebar from '../sidebar/NewChatSidebar'
import NewContactSidebar from '../sidebar/NewContactSidebar'
import SettingsSidebar from '../sidebar/SettingsSidebar'
import ChatArea from '../chat/ChatArea'
import WelcomeScreen from '../chat/WelcomeScreen'
import { ChatProvider, useChatContext } from '../../contexts/ChatContext'

type NavView = 'chats' | 'new-chat' | 'new-contact' | 'settings'

function AppLayoutInner() {
  const [activeView, setActiveView] = useState<NavView>('chats')
  const { activeRoomId, setActiveRoomId } = useChatContext()

  function handleSelectRoom(roomId: string) {
    setActiveRoomId(roomId)
    setActiveView('chats')
  }

  function handleBack() {
    setActiveView('chats')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#111b21' }}>
      <NavBar activeView={activeView} onViewChange={setActiveView} />

      {/* Sidebar panel — 360px */}
      <div className="w-[360px] flex-shrink-0 flex flex-col h-full border-r" style={{ borderColor: '#2a3942' }}>
        {activeView === 'chats' && (
          <ChatListSidebar
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            onNewChat={() => setActiveView('new-chat')}
          />
        )}
        {activeView === 'new-chat' && (
          <NewChatSidebar
            onBack={handleBack}
            onNewContact={() => setActiveView('new-contact')}
            onSelectRoom={handleSelectRoom}
          />
        )}
        {activeView === 'new-contact' && (
          <NewContactSidebar onBack={handleBack} onSelectRoom={handleSelectRoom} />
        )}
        {activeView === 'settings' && (
          <SettingsSidebar />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeRoomId ? (
          <ChatArea roomId={activeRoomId} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <ChatProvider>
      <AppLayoutInner />
    </ChatProvider>
  )
}
