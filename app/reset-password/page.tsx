'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleReset() {
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) await supabase.auth.signOut()
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
        <h1 style={{ fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>Password updated!</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
          You can now log in with your new password.
        </p>
        <button className="btn-primary" onClick={() => router.push('/login')}>
          Go to login
        </button>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>🔒</p>
        <h1 style={{ fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>Set new password</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
          Enter your new password below.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" type="password"
            placeholder="New password (min. 6 characters)"
            value={password} onChange={e => setPassword(e.target.value)}/>
          <input className="input-field" type="password"
            placeholder="Confirm password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReset()}/>
          {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}
          <button className="btn-primary" onClick={handleReset} disabled={loading}>
            {loading ? '...' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  )
}
