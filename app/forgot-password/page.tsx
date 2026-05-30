'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) return setError('Please enter your email')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function handleBackToLogin() {
    await supabase.auth.signOut()
    await new Promise(resolve => setTimeout(resolve, 500))
    router.replace('/login')
  }

  if (sent) return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>📬</p>
        <h1 style={{ fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>Check your email</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.6 }}>
          We sent a password reset link to {email}.
        </p>
        <button className="btn-ghost" onClick={handleBackToLogin}>
          ← Back to login
        </button>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <button onClick={handleBackToLogin}
          style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32, padding: 0, fontFamily: 'DM Sans, sans-serif', textAlign: 'left' }}>
          ← Back
        </button>

        <p style={{ fontSize: 40, marginBottom: 16 }}>🔑</p>
        <h1 style={{ fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>Forgot your password?</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.6 }}>
          Enter your email and we'll send you a reset link.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
          {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : 'Send reset link'}
          </button>
        </div>
      </div>
    </div>
  )
}
