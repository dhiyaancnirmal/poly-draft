import { NextResponse } from 'next/server'
import { fetchDailyMarkets } from '@/lib/api/polymarket'

export const runtime = 'edge'
export const revalidate = 300 // 5-minute cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const seedParam = searchParams.get('seed') || undefined
    const limitParam = searchParams.get('limit')
    const targetDate = dateParam ? new Date(dateParam) : undefined
    const maxResults = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 50

    const markets = await fetchDailyMarkets(targetDate, seedParam, maxResults)

    return NextResponse.json(markets, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
