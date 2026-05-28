'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const FEELINGS = [
  { value: 'great', label: 'Great 🔥' },
  { value: 'good', label: 'Good 😊' },
  { value: 'okay', label: 'Okay 😐' },
  { value: 'tough', label: 'Tough 😤' },
]

const WEATHERS = [
  { value: 'sunny', label: '☀️ Sunny' },
  { value: 'cloudy', label: '☁️ Cloudy' },
  { value: 'rainy', label: '🌧 Rainy' },
  { value: 'windy', label: '💨 Windy' },
  { value: 'cold', label: '🥶 Cold' },
  { value: 'hot', label: '🥵 Hot' },
]

export default function NewRunPage() {
  const supabase = createClient()
  const router = useRouter()

  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [feeling, setFeeling] = useState('')
  const [weather, setWeather] = useState('')
  const [memo, setMemo] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      let photo_url = null

      // 사진 업로드
      if (photo) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('run-photos')
          .upload(path, photo)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage
          .from('run-photos')
          .getPublicUrl(path)
        photo_url = urlData.publicUrl
      }

      // 러닝 기록 저장
      const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')
      const { error: insertError } = await supabase.from('runs').insert({
        user_id: user.id,
        run_date: date,
        distance_km: distance ? parseFloat(distance) : null,
        duration_minutes: totalMinutes > 0 ? totalMinutes : null,
        feeling: feeling || null,
        weather: weather || null,
        memo: memo.trim() || null,
        photo_url,
      })

      if (insertError) throw insertError
      router.push('/')

    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <div className="app-card">

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => router.back()}
            style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
            ← back
          </button>
        </div>

        <h1 style={{ fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>How was it?</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>Log your run</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 날짜 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>DATE</p>
            <input
              className="input-field"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* 거리 + 시간 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>DISTANCE & TIME</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  className="input-field"
                  type="number"
                  placeholder="0.0"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  style={{ paddingRight: 36 }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>km</span>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    style={{ paddingRight: 28 }}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)' }}>h</span>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    style={{ paddingRight: 28 }}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)' }}>m</span>
                </div>
              </div>
            </div>
          </div>

          {/* 컨디션 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>HOW DID YOU FEEL?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {FEELINGS.map(f => (
                <button key={f.value}
                  className={`feeling-btn ${feeling === f.value ? 'active' : ''}`}
                  onClick={() => setFeeling(feeling === f.value ? '' : f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 날씨 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>WEATHER</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {WEATHERS.map(w => (
                <button key={w.value}
                  className={`weather-btn ${weather === w.value ? 'active' : ''}`}
                  onClick={() => setWeather(weather === w.value ? '' : w.value)}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>MEMO</p>
            <textarea
              className="input-field"
              placeholder="How did it feel? What did you notice?"
              rows={3}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{ resize: 'none', lineHeight: 1.6 }}
            />
          </div>

          {/* 사진 */}
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>PHOTO</p>
            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={photoPreview} alt="preview"
                  style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }}/>
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>×</button>
              </div>
            ) : (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 80, borderRadius: 12,
                border: '0.5px dashed var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer', color: 'var(--muted)', fontSize: 13, gap: 8
              }}>
                📷 Add photo
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }}/>
              </label>
            )}
          </div>

          {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={handleSave} disabled={loading}
            style={{ marginTop: 8 }}>
            {loading ? 'Saving...' : 'Save run'}
          </button>

        </div>
      </div>
    </div>
  )
}
