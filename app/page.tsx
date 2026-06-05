'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Run } from '@/hooks/useRuns'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  const supabase = useRef<SupabaseClient>(createClient()).current
  const router = useRouter()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => { fetchRuns() }, [year, month])

  async function fetchRuns() {
    setLoading(true)
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const nextMonth = month === 11
      ? `${year + 1}-01`
      : `${year}-${String(month + 2).padStart(2, '0')}`
    const { data } = await supabase
      .from('runs')
      .select('*')
      .gte('run_date', `${monthStr}-01`)
      .lt('run_date', `${nextMonth}-01`)
      .order('run_date', { ascending: false })
    if (data) setRuns(data)
    setLoading(false)
  }

  async function deleteRun(id: string) {
    await supabase.from('runs').delete().eq('id', id)
    setRuns(prev => prev.filter(r => r.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    if (isCurrentMonth) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const totalKm = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0)

  return (
    <div className="app-shell">
      <div className="app-card">

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, color: 'var(--text)', marginBottom: 2 }}>afterun</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {runs.length === 0 ? 'no runs this month' : `${runs.length} run${runs.length > 1 ? 's' : ''} · ${totalKm.toFixed(1)} km`}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, paddingTop: 4 }}>
            <button onClick={() => router.push(`/calendar?year=${year}&month=${month}`)}
              style={{ fontSize: 12, color: 'var(--amber-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              calendar
            </button>
            <button onClick={handleLogout}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              log out
            </button>
          </div>
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>‹</button>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{monthName}</p>
          <button onClick={nextMonth} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            color: isCurrentMonth ? 'var(--border)' : 'var(--muted)',
            cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>›</button>
        </div>

        {/* 러닝 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>Loading...</p>
          ) : runs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🏃</p>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                No runs in {monthName}.<br/>
                {isCurrentMonth ? 'Log your first run this month.' : ''}
              </p>
            </div>
          ) : (
            runs.map(run => (
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
                  {run.distance_km && <span className="tag">{run.distance_km} km</span>}
                  {run.duration_minutes && <span className="tag">{formatDuration(run.duration_minutes)}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB */}
        {isCurrentMonth && (
          <button onClick={() => router.push('/new')}
            style={{
              position: 'fixed', bottom: 32, right: 32,
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--amber-400)', color: 'var(--bg)',
              border: 'none', fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(239,159,39,0.4)', zIndex: 10,
            }}>+</button>
        )}

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
