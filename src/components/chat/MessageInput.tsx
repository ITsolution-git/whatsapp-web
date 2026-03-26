import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Paperclip, Smile, Mic, Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [text])

  return (
    <div
      className="flex items-end gap-2 px-3 py-2 flex-shrink-0"
      style={{ background: '#202c33', borderTop: '1px solid #2a3942' }}
    >
      {/* Emoji button */}
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors flex-shrink-0 mb-0.5"
        style={{ color: '#aebac1' }}
        title="Emoji"
      >
        <Smile size={24} />
      </button>

      {/* Attachment button */}
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors flex-shrink-0 mb-0.5"
        style={{ color: '#aebac1' }}
        title="Attach"
      >
        <Paperclip size={22} />
      </button>

      {/* Textarea */}
      <div className="flex-1 flex items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none placeholder:text-[#8696a0] disabled:opacity-50 resize-none leading-relaxed"
          style={{
            background: '#2a3942',
            color: '#e9edef',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />
      </div>

      {/* Mic or Send */}
      {text.trim() ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 mb-0.5 disabled:opacity-50"
          style={{ background: '#00a884', color: '#111b21' }}
          title="Send"
        >
          <Send size={20} />
        </button>
      ) : (
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors flex-shrink-0 mb-0.5"
          style={{ color: '#aebac1' }}
          title="Voice message"
        >
          <Mic size={24} />
        </button>
      )}
    </div>
  )
}
