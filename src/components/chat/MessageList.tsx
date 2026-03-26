import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { UiMessage } from '../../types'

interface MessageListProps {
  messages: UiMessage[]
}

function formatDateLabel(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (isToday) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  if (isYesterday) return 'Yesterday'

  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupMessagesByDate(messages: UiMessage[]) {
  const groups: { date: Date; messages: UiMessage[] }[] = []
  let currentDate = ''
  messages.forEach((msg) => {
    const dateStr = msg.sentAt.toDateString()
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: msg.sentAt, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const groups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto chat-bg px-4 py-4 flex flex-col gap-1">
      {groups.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#8696a0' }}>
            No messages yet. Say hello!
          </p>
        </div>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {/* Date separator */}
          <div className="flex justify-center my-2">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: '#182229', color: '#8696a0' }}
            >
              {formatDateLabel(group.date)}
            </span>
          </div>

          {group.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
