'use client'
import { useState } from 'react'
import { useRuns } from '@/hooks/useRuns'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const FEELING_EMOJI: Record<string, string> = {
  great: '🔥', good: '😊', okay: '😐', tough: '😤'
}
const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧', windy: '💨', cold: '🥶', hot: '🥵'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HomePage() {
  const { runs, loading } = useRuns()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const { deleteRun } = useRuns()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="app-card">

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, color: 'var(--text)', marginBottom: 2 }}>afterun</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {runs.length === 0 ? 'your running journal' : `${runs.length} run${runs.length > 1 ? 's' : ''} logged`}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button onClick={() => router.push('/calendar')}
              style={{ fontSize: 12, color: 'var(--amber-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              calendar
            </button>
            <button onClick={handleLogout}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              log out
            </button>
          </div>
        </div>

        {/* 빈 상태 */}
        {runs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🏃</p>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
              No runs yet.<br/>Log your first run.
            </p>
          </div>
        )}

        {/* 러닝 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {runs.map(run => (
            <div key={run.id} className="run-card"
              onClick={() => router.push(`/run/${run.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{formatDate(run.run_date)}</span>
                  {run.feeling && <span style={{ fontSize: 14 }}>{FEELING_EMOJI[run.feeling]}</span>}
                  {run.weather && <span style={{ fontSize: 14 }}>{WEATHER_EMOJI[run.weather]}</span>}
                </div>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(run.id) }}
                  style={{ color: 'var(--muted)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, opacity: 0.5 }}>
                  ×
                </button>
              </div>

              {run.memo && (
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic', opacity: 0.85 }}>
                  "{run.memo}"
                </p>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {run.distance_km && (
                  <span className="tag">{run.distance_km} km</span>
                )}
                {run.duration_minutes && (
                  <span className="tag">{formatDuration(run.duration_minutes)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAB — 새 기록 버튼 */}
        <button onClick={() => router.push('/new')}
          style={{
            position: 'fixed',
            bottom: 32, right: 32,
            width: 52, height: 52,
            borderRadius: '50%',
            background: 'var(--amber-400)',
            color: 'var(--bg)',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(239,159,39,0.4)',
            zIndex: 10,
          }}>
          +
        </button>

      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text)' }}>Delete this run?</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              This entry will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button onClick={async () => { await deleteRun(deleteTarget); setDeleteTarget(null) }}
                style={{ flex: 1, background: '#E24B4A', color: 'white', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
