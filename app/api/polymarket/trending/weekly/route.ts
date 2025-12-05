import { NextResponse } from "next/server";
import { fetchTrendingMarkets } from "@/lib/api/polymarket";

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const markets = await fetchTrendingMarkets(20);
    return NextResponse.json(markets);
  } catch (error) {
    console.error("Trending weekly error:", error);
    return NextResponse.json({ error: "Failed to fetch trending markets" }, { status: 500 });
  }
}

