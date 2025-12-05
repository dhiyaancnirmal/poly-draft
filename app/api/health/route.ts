'use server'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getJobSummary } from '@/lib/jobs/metrics'

export async function GET() {
    try {
        const supabase = (await createServerClient()) as any
        const { error } = await supabase.from('leagues').select('id').limit(1)
        if (error) {
            return NextResponse.json({ ok: false, db: error.message }, { status: 500 })
        }
        return NextResponse.json({
            ok: true,
            time: new Date().toISOString(),
            jobs: getJobSummary(),
        })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || 'health check failed' }, { status: 500 })
    }
}
