import { NextResponse } from 'next/server'
import { fetchTrendingMarketsDaily } from '@/lib/api/polymarket'

export const runtime = 'edge'
export const revalidate = 300 // 5-minute cache

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seedParam = searchParams.get('seed') || undefined

    const markets = await fetchTrendingMarketsDaily(seedParam)

    return NextResponse.json(markets, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending markets (daily)' },
      { status: 500 }
    )
  }
}

