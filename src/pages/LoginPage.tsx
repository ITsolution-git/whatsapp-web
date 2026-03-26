import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, ArrowRight, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { getOrCreateDeviceId } from '../lib/deviceId'
import { upsertSubscriber } from '../lib/roomService'
import { cn } from '../lib/cn'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number')
      return
    }
    setLoading(true)
    try {
      await api.requestOtp(phoneNumber.trim())
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.trim().length < 4) {
      setError('Please enter the OTP')
      return
    }
    setLoading(true)
    try {
      const deviceId = getOrCreateDeviceId()
      const res = await api.verify(phoneNumber.trim(), otp.trim(), undefined, deviceId, 'web')
      const { token, subscriber } = res
      if (!token) throw new Error('No token received')
      await upsertSubscriber(subscriber)
      setAuth(token, { ...subscriber, createdAt: subscriber.createdAt ?? '' })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4" style={{ background: '#111b21' }}>
      {/* Top green bar */}
      <div className="fixed top-0 left-0 right-0 h-[220px]" style={{ background: '#00a884' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="rounded-xl shadow-2xl overflow-hidden" style={{ background: '#202c33' }}>
          {/* Logo header */}
          <div className="flex flex-col items-center pt-10 pb-6 px-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#00a884' }}
            >
              <MessageSquare size={38} color="#111b21" fill="#111b21" />
            </div>
            <h1 className="text-2xl font-light mb-1" style={{ color: '#e9edef' }}>
              WhatsApp Web
            </h1>
            <p className="text-sm text-center" style={{ color: '#8696a0' }}>
              {step === 'phone'
                ? 'Enter your phone number to get started'
                : `We sent a code to ${phoneNumber}`}
            </p>
          </div>

          <div className="px-8 pb-8">
            {step === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8696a0' }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 000 0000"
                    autoFocus
                    className={cn(
                      'w-full px-4 py-3 rounded-lg text-sm outline-none transition-all',
                      'placeholder:text-[#8696a0]'
                    )}
                    style={{
                      background: '#2a3942',
                      color: '#e9edef',
                      border: '1px solid #3d5360',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#00a884')}
                    onBlur={(e) => (e.target.style.borderColor = '#3d5360')}
                  />
                  <p className="text-xs mt-1.5" style={{ color: '#8696a0' }}>
                    Include country code (e.g. +1 for US)
                  </p>
                </div>

                {error && (
                  <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#f15c6d', background: '#2a1a1e' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: '#00a884', color: '#111b21' }}
                >
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      Continue <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8696a0' }}>
                    Verification code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg text-sm text-center tracking-widest outline-none transition-all placeholder:text-[#8696a0]"
                    style={{
                      background: '#2a3942',
                      color: '#e9edef',
                      border: '1px solid #3d5360',
                      fontSize: '1.4rem',
                      letterSpacing: '0.5rem',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#00a884')}
                    onBlur={(e) => (e.target.style.borderColor = '#3d5360')}
                  />
                </div>

                {error && (
                  <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#f15c6d', background: '#2a1a1e' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ background: '#00a884', color: '#111b21' }}
                >
                  {loading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      Verify <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    setError('')
                  }}
                  className="w-full py-2 text-sm"
                  style={{ color: '#00a884' }}
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8696a0' }}>
          End-to-end encrypted
        </p>
      </div>
    </div>
  )
}
