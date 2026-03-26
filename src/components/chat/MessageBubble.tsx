import { cn } from '../../lib/cn'
import type { UiMessage } from '../../types'

interface MessageBubbleProps {
  message: UiMessage
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// SVG tail for outgoing (right side)
function TailOut() {
  return (
    <svg
      className="absolute -right-[8px] bottom-0"
      width="8" height="13"
      viewBox="0 0 8 13"
      fill="none"
    >
      <path d="M0 0 L8 13 L0 13 Z" fill="#005c4b" />
    </svg>
  )
}

// SVG tail for incoming (left side)
function TailIn() {
  return (
    <svg
      className="absolute -left-[8px] bottom-0"
      width="8" height="13"
      viewBox="0 0 8 13"
      fill="none"
    >
      <path d="M8 0 L0 13 L8 13 Z" fill="#202c33" />
    </svg>
  )
}

function StatusIcon({ status }: { status: UiMessage['status'] }) {
  if (status === 'sending') return <span style={{ color: '#7fb8a7' }}>✓</span>
  if (status === 'sent')    return <span style={{ color: '#7fb8a7' }}>✓✓</span>
  if (status === 'delivered') return <span style={{ color: '#7fb8a7' }}>✓✓</span>
  if (status === 'seen')    return <span style={{ color: '#53bdeb' }}>✓✓</span>
  return null
}

function renderContent(message: UiMessage): React.ReactNode {
  const { content } = message
  if (content.type === 'text') {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: '#e9edef' }}>
        {content.body}
      </p>
    )
  }
  if (content.type === 'file') {
    return (
      <p className="text-sm leading-relaxed" style={{ color: '#e9edef' }}>
        📎 {content.name}
      </p>
    )
  }
  if (content.type === 'sticker') {
    return <p className="text-sm" style={{ color: '#e9edef' }}>🎭 Sticker</p>
  }
  if (content.type === 'info') {
    return (
      <p className="text-xs italic" style={{ color: '#8696a0' }}>
        {content.body}
      </p>
    )
  }
  return null
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { isOwn } = message

  return (
    <div className={cn('flex mb-1', isOwn ? 'justify-end' : 'justify-start')}>
      <div className="relative" style={{ maxWidth: '65%' }}>
        <div
          className={cn(
            'px-3 py-1.5 relative shadow-sm',
            isOwn ? 'rounded-tl-lg rounded-tr-lg rounded-bl-lg' : 'rounded-tl-lg rounded-tr-lg rounded-br-lg'
          )}
          style={{
            background: isOwn ? '#005c4b' : '#202c33',
          }}
        >
          {renderContent(message)}

          {/* Time + status row */}
          <div className="flex items-center justify-end gap-1 mt-0.5 ml-4 float-right clear-both" style={{ marginBottom: '-2px' }}>
            <span className="text-[11px] leading-none" style={{ color: isOwn ? '#7fb8a7' : '#8696a0' }}>
              {formatTime(message.sentAt)}
            </span>
            {isOwn && (
              <span className="text-[12px] leading-none">
                <StatusIcon status={message.status} />
              </span>
            )}
          </div>
          <div className="clear-both" />
        </div>

        {/* Bubble tail */}
        {isOwn ? <TailOut /> : <TailIn />}
      </div>
    </div>
  )
}
