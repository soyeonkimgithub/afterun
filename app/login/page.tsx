'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else { router.push('/'); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>

        <div style={{ marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#2E1F08', border: '1px solid var(--amber-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28, fontSize: 22
          }}>🏃</div>
          <h1 style={{ fontSize: 34, marginBottom: 8, lineHeight: 1.1, color: 'var(--text)' }}>
            {isSignUp ? 'Start your\njournal.' : 'Welcome\nback.'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {isSignUp ? 'Every run tells a story.' : 'Your runs are waiting.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input-field" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
          <input className="input-field" type="password" placeholder="Password (min. 6 characters)"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
          {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '...' : isSignUp ? 'Create account' : 'Log in'}
          </button>
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '8px 0', cursor: 'pointer', background: 'none', border: 'none' }}>
            {isSignUp ? 'Already have an account → Log in' : 'New here → Create account'}
          </button>
          {!isSignUp && (
            <button onClick={() => router.push('/forgot-password')}
              style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '4px 0', cursor: 'pointer', background: 'none', border: 'none', opacity: 0.7 }}>
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
