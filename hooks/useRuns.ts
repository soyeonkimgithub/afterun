'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Run = {
  id: string
  run_date: string
  distance_km: number | null
  duration_minutes: number | null
  weather: string | null
  feeling: string | null
  memo: string | null
  photo_url: string | null
  created_at: string
}

export function useRuns() {
  const supabase = useRef<SupabaseClient>(createClient()).current
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRuns() }, [])

  async function fetchRuns() {
    const { data } = await supabase
      .from('runs')
      .select('*')
      .order('run_date', { ascending: false })
    if (data) setRuns(data)
    setLoading(false)
  }

  async function deleteRun(id: string) {
    await supabase.from('runs').delete().eq('id', id)
    setRuns(prev => prev.filter(r => r.id !== id))
  }

  return { runs, loading, deleteRun, refetch: fetchRuns }
}
