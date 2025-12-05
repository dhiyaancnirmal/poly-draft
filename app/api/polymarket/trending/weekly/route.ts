import { NextResponse } from "next/server";
import { fetchTrendingMarkets } from "@/lib/api/polymarket";

// Explicitly mark as dynamic to silence static rendering warnings
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const markets = await fetchTrendingMarkets(20);
    return NextResponse.json(markets);
  } catch (error) {
    console.error("Trending weekly error:", error);
    return NextResponse.json({ error: "Failed to fetch trending markets" }, { status: 500 });
  }
}

