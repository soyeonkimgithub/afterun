'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Run } from '@/hooks/useRuns'

const FEELING_EMOJI: Record<string, string> = {
  great: '🔥', good: '😊', okay: '😐', tough: '😤'
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const supabase = useRef<SupabaseClient>(createClient()).current
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = new Date()

  const initYear = parseInt(searchParams.get('year') || String(today.getFullYear()))
  const initMonth = parseInt(searchParams.get('month') || String(today.getMonth()))

  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRuns() }, [year, month])

  async function fetchRuns() {
    setLoading(true)
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const { data } = await supabase
      .from('runs')
      .select('*')
      .gte('run_date', `${monthStr}-01`)
      .lte('run_date', `${monthStr}-31`)
      .order('run_date', { ascending: false })
    if (data) setRuns(data)
    setLoading(false)
  }

  const runMap: Record<string, Run> = {}
  runs.forEach(r => { runMap[r.run_date] = r })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toLocaleDateString('en-CA')
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  function getDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (isCurrentMonth) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const totalKm = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0)

  return (
    <div className="app-shell">
      <div className="app-card">

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, color: 'var(--text)' }}>afterun</h1>
          <button onClick={() => router.push(`/?year=${year}&month=${month}`)}
            style={{ fontSize: 12, color: 'var(--amber-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            list
          </button>
        </div>

        {/* 이번 달 통계 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 500, color: 'var(--amber-400)', marginBottom: 2 }}>{runs.length}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>runs</p>
          </div>
          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '0.5px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 500, color: 'var(--amber-400)', marginBottom: 2 }}>{totalKm.toFixed(1)}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>km total</p>
          </div>
        </div>

        {/* 월 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={prevMonth} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>‹</button>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{monthName}</p>
          <button onClick={nextMonth} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            color: isCurrentMonth ? 'var(--border)' : 'var(--muted)',
            cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>›</button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAYS.map(d => (
            <p key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', padding: '4px 0' }}>{d}</p>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 24 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i}/>
            const dateStr = getDateStr(day)
            const run = runMap[dateStr]
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr

            return (
              <div key={i}
                onClick={() => run && router.push(`/run/${run.id}`)}
                style={{
                  aspectRatio: '1', borderRadius: 10,
                  background: run ? '#2E1F08' : 'var(--surface)',
                  border: isToday
                    ? '1.5px solid var(--amber-400)'
                    : run ? '0.5px solid var(--amber-600)'
                    : '0.5px solid var(--border)',
                  cursor: run ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  opacity: isFuture ? 0.3 : 1,
                }}>
                <span style={{
                  fontSize: 11,
                  color: run ? 'var(--amber-400)' : isToday ? 'var(--amber-400)' : 'var(--muted)',
                  fontWeight: isToday ? 500 : 400,
                }}>{day}</span>
                {run?.feeling && <span style={{ fontSize: 10, lineHeight: 1 }}>{FEELING_EMOJI[run.feeling]}</span>}
                {run && !run.feeling && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber-400)' }}/>}
              </div>
            )
          })}
        </div>

        {/* 이번 달 기록 목록 */}
        {runs.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontWeight: 500, letterSpacing: '0.04em' }}>
              THIS MONTH
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {runs.map(run => (
                <div key={run.id}
                  onClick={() => router.push(`/run/${run.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'var(--surface)',
                    borderRadius: 12,
                    border: '0.5px solid var(--border)',
                    cursor: 'pointer',
                  }}>
                  <span style={{ fontSize: 18 }}>{run.feeling ? FEELING_EMOJI[run.feeling] : '🏃'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                      {new Date(run.run_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {run.memo && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {run.memo}
                      </p>
                    )}
                  </div>
                  {run.distance_km && (
                    <span style={{ fontSize: 12, color: 'var(--amber-400)', fontWeight: 500 }}>{run.distance_km}km</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
    </div>
  )
}
