import { Lock } from 'lucide-react'

function LaptopIllustration() {
  return (
    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Screen outer shell */}
      <rect x="28" y="8" width="204" height="144" rx="10" fill="#1a2632" stroke="#2a3942" strokeWidth="1.5" />
      {/* Screen inner (display) */}
      <rect x="38" y="18" width="184" height="124" rx="5" fill="#0b141a" />

      {/* Left sidebar panel */}
      <rect x="38" y="18" width="62" height="124" fill="#111b21" rx="0" />
      {/* Sidebar header */}
      <rect x="44" y="25" width="50" height="7" rx="3.5" fill="#2a3942" />
      {/* Search bar in sidebar */}
      <rect x="44" y="37" width="50" height="6" rx="3" fill="#2a3942" />
      {/* Chat items */}
      {[50, 68, 86, 104].map((y, i) => (
        <g key={i}>
          <circle cx="52" cy={y + 7} r="7" fill="#2a3942" />
          <rect x="63" y={y + 4} width="26" height="3" rx="1.5" fill="#2a3942" />
          <rect x="63" y={y + 9} width="18" height="2.5" rx="1.25" fill="#374045" />
          {/* Divider */}
          <line x1="44" y1={y + 17} x2="96" y2={y + 17} stroke="#1f2c34" strokeWidth="0.5" />
        </g>
      ))}

      {/* Main chat area background */}
      <rect x="100" y="18" width="122" height="124" fill="#0b141a" />

      {/* Chat header */}
      <rect x="100" y="18" width="122" height="18" fill="#202c33" />
      <circle cx="113" cy="27" r="6" fill="#2a3942" />
      <rect x="122" y="24" width="30" height="3" rx="1.5" fill="#3b4a54" />
      <rect x="122" y="29" width="20" height="2" rx="1" fill="#2a3942" />
      {/* Header icons */}
      <circle cx="206" cy="27" r="4" fill="#2a3942" />
      <circle cx="216" cy="27" r="4" fill="#2a3942" />

      {/* Message bubbles - outgoing (green) */}
      <rect x="147" y="44" width="68" height="14" rx="7" fill="#005c4b" />
      <polygon points="215,50 219,44 219,58" fill="#005c4b" />

      {/* Message bubbles - incoming (dark) */}
      <rect x="104" y="65" width="78" height="14" rx="7" fill="#202c33" />
      <polygon points="104,71 100,65 100,79" fill="#202c33" />

      {/* Outgoing */}
      <rect x="153" y="86" width="62" height="14" rx="7" fill="#005c4b" />
      <polygon points="215,92 219,86 219,100" fill="#005c4b" />

      {/* Incoming */}
      <rect x="104" y="107" width="85" height="14" rx="7" fill="#202c33" />
      <polygon points="104,113 100,107 100,121" fill="#202c33" />

      {/* Message input bar */}
      <rect x="103" y="128" width="112" height="11" rx="5.5" fill="#2a3942" />
      <circle cx="113" cy="133" r="3" fill="#374045" />
      <circle cx="207" cy="133" r="3" fill="#374045" />

      {/* Laptop base/keyboard */}
      <rect x="18" y="152" width="224" height="13" rx="3" fill="#2a3942" />
      {/* Keyboard keys suggestion */}
      <rect x="90" y="156" width="80" height="5" rx="2.5" fill="#374045" />
      {/* Base shadow / bottom */}
      <path d="M14 165 Q8 170 8 173 L252 173 Q252 170 246 165 Z" fill="#374045" />
      {/* Bottom vents */}
      <rect x="115" y="167" width="30" height="2" rx="1" fill="#2a3942" />

      {/* WhatsApp green glow accent on screen top */}
      <rect x="38" y="18" width="184" height="3" rx="0" fill="#00a884" opacity="0.6" />
    </svg>
  )
}

export default function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full relative chat-bg select-none">
      <div className="flex flex-col items-center text-center max-w-[400px] px-6 gap-5">
        {/* Laptop illustration */}
        <LaptopIllustration />

        {/* Thin separator */}
        <div
          className="w-52 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #3b4a54, transparent)' }}
        />

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-light" style={{ color: '#e9edef' }}>
            Download WhatsApp for Windows
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#8696a0' }}>
            Make calls, share your screen and get a faster experience when you download the Windows app.
          </p>
        </div>
      </div>

      {/* Bottom encryption notice */}
      <div className="absolute bottom-6 flex items-center gap-1.5">
        <Lock size={12} style={{ color: '#8696a0' }} />
        <span className="text-xs" style={{ color: '#8696a0' }}>
          Your personal messages are{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            end-to-end encrypted
          </span>
        </span>
      </div>
    </div>
  )
}
