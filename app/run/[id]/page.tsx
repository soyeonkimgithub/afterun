'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Run } from '@/hooks/useRuns'

const FEELING_LABEL: Record<string, string> = {
  great: 'Great 🔥', good: 'Good 😊', okay: 'Okay 😐', tough: 'Tough 😤'
}
const WEATHER_LABEL: Record<string, string> = {
  sunny: '☀️ Sunny', cloudy: '☁️ Cloudy', rainy: '🌧 Rainy',
  windy: '💨 Windy', cold: '🥶 Cold', hot: '🥵 Hot'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
}

export default function RunDetailPage() {
  const supabase = useRef<SupabaseClient>(createClient()).current
  const router = useRouter()
  const { id } = useParams()
  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchRun() {
      const { data } = await supabase
        .from('runs')
        .select('*')
        .eq('id', id)
        .single()
      if (data) setRun(data)
      setLoading(false)
    }
    fetchRun()
  }, [id])

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#1A1A18',
        useCORS: true,
      })
      const dateStr = run?.run_date || new Date().toLocaleDateString('en-CA')
      const link = document.createElement('a')
      link.download = `afterun-${dateStr}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) { console.error(e) }
    setDownloading(false)
  }

  if (loading) return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  if (!run) return (
    <div className="app-shell">
      <div className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Run not found.</p>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <div className="app-card">

        <button onClick={() => router.back()}
          style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0, marginBottom: 28 }}>
          ← back
        </button>

        {/* 공유 카드 — 이미지로 저장되는 부분 */}
        <div ref={cardRef} style={{
          background: 'var(--bg)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
          border: '0.5px solid var(--border)',
        }}>
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#2E1F08', border: '1px solid var(--amber-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14
            }}>🏃</div>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>afterun</span>
          </div>

          {/* 날짜 */}
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
            {formatDate(run.run_date)}
          </p>

          {/* 태그 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {run.feeling && <span className="tag">{FEELING_LABEL[run.feeling]}</span>}
            {run.weather && <span className="tag">{WEATHER_LABEL[run.weather]}</span>}
          </div>

          {/* 수치 */}
          {(run.distance_km || run.duration_minutes) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {run.distance_km && (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '0.5px solid var(--border)', textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: 22, fontWeight: 500, color: 'var(--amber-400)', marginBottom: 2 }}>{run.distance_km}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>km</p>
                </div>
              )}
              {run.duration_minutes && (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', border: '0.5px solid var(--border)', textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: 22, fontWeight: 500, color: 'var(--amber-400)', marginBottom: 2 }}>{formatDuration(run.duration_minutes)}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>time</p>
                </div>
              )}
            </div>
          )}

          {/* 사진 */}
          {run.photo_url && (
            <img src={run.photo_url} alt="run photo"
              style={{ width: '100%', borderRadius: 12, maxHeight: 220, objectFit: 'cover', marginBottom: 16 }}
              crossOrigin="anonymous"
            />
          )}

          {/* 메모 */}
          {run.memo && (
            <div style={{
              borderLeft: '2px solid var(--amber-400)',
              paddingLeft: 14,
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "{run.memo}"
              </p>
            </div>
          )}

          {/* 푸터 */}
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
            {new Date(run.created_at).toLocaleDateString('en-CA')} · afterun.run
          </p>
        </div>

        {/* 이미지 저장 버튼 */}
        <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Saving...' : '↓ Save as image'}
        </button>

      </div>
    </div>
  )
}
