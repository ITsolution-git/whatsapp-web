import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, User, Phone, X, RefreshCw, ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'
import { upsertSubscriber, getOrCreateDmRoom } from '../../lib/roomService'
import { send as socketSend } from '../../lib/socket'
import { cn } from '../../lib/cn'

interface NewContactSidebarProps {
  onBack: () => void
  onSelectRoom: (roomId: string) => void
}

const COUNTRIES = [
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'JP', name: 'Japan', dial: '+81' },
]

interface FloatLabelInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}

function FloatLabelInput({ label, value, onChange, type = 'text' }: FloatLabelInputProps) {
  const [focused, setFocused] = useState(false)
  const isFloated = focused || value.length > 0

  return (
    <div className="relative pb-4">
      <label
        className={cn(
          'absolute left-0 transition-all duration-200 pointer-events-none',
          isFloated ? 'text-xs top-0' : 'text-sm top-3.5'
        )}
        style={{ color: focused ? '#00a884' : '#8696a0' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent pt-5 pb-1 text-sm outline-none"
        style={{
          color: '#e9edef',
          borderBottom: `1px solid ${focused ? '#00a884' : '#374045'}`,
        }}
      />
    </div>
  )
}

export default function NewContactSidebar({ onBack, onSelectRoom }: NewContactSidebarProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }
    setLoading(true)
    try {
      const fullNumber = `${selectedCountry.dial}${phone.trim().replace(/^0/, '')}`
      const sub = await api.lookupSubscriber(fullNumber)
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null
      await upsertSubscriber({
        id: sub.id,
        phoneNumber: sub.phoneNumber,
        name: displayName ?? sub.name,
        lastSeenAt: sub.lastSeenAt ? new Date(sub.lastSeenAt).getTime() : undefined,
      }, true)
      socketSend('subscribe_presence', { subscriberIds: [sub.id] })
      const roomId = await getOrCreateDmRoom(sub.id)
      onSelectRoom(roomId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#111b21' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#202c33' }}>
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition-colors"
          style={{ color: '#aebac1' }}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-medium text-base" style={{ color: '#e9edef' }}>
          New contact
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-2">
          {/* Name section */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-4"
              style={{ background: '#2a3942' }}
            >
              <User size={22} style={{ color: '#8696a0' }} />
            </div>
            <div className="flex-1 space-y-0">
              <FloatLabelInput label="First name" value={firstName} onChange={setFirstName} />
              <FloatLabelInput label="Last name" value={lastName} onChange={setLastName} />
            </div>
          </div>

          {/* Phone section */}
          <div className="flex items-start gap-4 mt-4">
            <div className="flex items-center justify-center flex-shrink-0 mt-5" style={{ width: '48px' }}>
              <Phone size={20} style={{ color: '#8696a0' }} />
            </div>
            <div className="flex-1">
              {/* Country selector */}
              <div className="relative pb-1">
                <label className="text-xs" style={{ color: '#8696a0' }}>
                  Country
                </label>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full flex items-center justify-between py-2 text-sm"
                  style={{
                    color: '#e9edef',
                    borderBottom: '1px solid #374045',
                  }}
                >
                  <span>{selectedCountry.code} {selectedCountry.dial}</span>
                  <ChevronDown size={14} style={{ color: '#8696a0' }} />
                </button>
                {showCountryDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 z-50 rounded-lg shadow-xl overflow-y-auto max-h-48"
                    style={{ background: '#2a3942' }}
                  >
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c)
                          setShowCountryDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-[#374045] transition-colors"
                        style={{ color: '#e9edef' }}
                      >
                        <span style={{ color: '#8696a0' }}>{c.code}</span>
                        <span>{c.name}</span>
                        <span className="ml-auto" style={{ color: '#8696a0' }}>{c.dial}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone number input */}
              <div className="relative pb-4 mt-2">
                <label className="text-xs" style={{ color: '#8696a0' }}>
                  Phone number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    placeholder="555 000 0000"
                    className="flex-1 bg-transparent pt-2 pb-1 text-sm outline-none placeholder:text-[#4a5568]"
                    style={{
                      color: '#e9edef',
                      borderBottom: `1px solid ${phoneFocused ? '#00a884' : '#374045'}`,
                    }}
                  />
                  {phone && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="flex-shrink-0"
                      style={{ color: '#e53e3e' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#f15c6d', background: '#2a1a1e' }}>
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#00a884', background: '#0a2a1e' }}>
              Contact added successfully!
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 mt-6"
            style={{ background: '#00a884', color: '#111b21' }}
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              'Add contact'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
