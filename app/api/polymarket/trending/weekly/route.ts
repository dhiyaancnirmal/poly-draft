import { NextResponse } from 'next/server'
import { fetchTrendingMarketsWeekly } from '@/lib/api/polymarket'

export const runtime = 'edge'
export const revalidate = 600 // 10-minute cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seedParam = searchParams.get('seed') || undefined

    const markets = await fetchTrendingMarketsWeekly(seedParam)

    return NextResponse.json(markets, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=900'
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending markets (weekly)' },
      { status: 500 }
    )
  }
}

