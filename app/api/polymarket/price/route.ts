import { NextRequest, NextResponse } from 'next/server';

const CLOB_API = 'https://clob.polymarket.com';
const CACHE_TTL = 30 * 1000; // 30 seconds cache for live prices

// In-memory cache for price data
const priceCache = new Map<string, { data: any; timestamp: number }>();

function getCachedPrice(marketId: string): any | null {
  const cached = priceCache.get(marketId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPrice(marketId: string, data: any): void {
  priceCache.set(marketId, { data, timestamp: Date.now() });
}

// Helper to extract token IDs from market data
function extractTokenIds(market: any): { yesTokenId: string; noTokenId: string } | null {
  if (!market.clobTokenIds) return null;
  
  try {
    // clobTokenIds can be a comma-separated string or an array
    const raw = Array.isArray(market.clobTokenIds)
      ? market.clobTokenIds
      : String(market.clobTokenIds).split(',');

    const tokenIds = raw.map((t: any) => String(t).trim()).filter(Boolean);

    if (tokenIds.length >= 2) {
      return {
        yesTokenId: tokenIds[0],
        noTokenId: tokenIds[1]
      };
    }
  } catch (error) {
    console.error('Error parsing token IDs:', error);
  }
  
  return null;
}

// Fetch current price from CLOB order book
async function getTokenPrice(tokenId: string): Promise<{ price: number; size: number } | null> {
  try {
    const response = await fetch(`${CLOB_API}/book?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyDraft/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const book = await response.json();
    
    // Get best bid (buy) and ask (sell) prices
    const bestBid = book.bids && book.bids.length > 0 ? parseFloat(book.bids[0].price) : 0;
    const bestAsk = book.asks && book.asks.length > 0 ? parseFloat(book.asks[0].price) : 1;
    
    // Calculate mid-price (average of best bid and ask)
    const midPrice = bestBid > 0 && bestAsk < 1 ? (bestBid + bestAsk) / 2 : bestAsk || bestBid || 0.5;
    
    // Get total size at best prices
    const bidSize = book.bids && book.bids.length > 0 ? parseFloat(book.bids[0].size) : 0;
    const askSize = book.asks && book.asks.length > 0 ? parseFloat(book.asks[0].size) : 0;
    
    return {
      price: midPrice,
      size: bidSize + askSize
    };
  } catch (error) {
    console.error(`Error fetching price for token ${tokenId}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    
    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCachedPrice(marketId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // First, get market details from Gamma API to extract token IDs
    const gammaResponse = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyDraft/1.0'
      }
    });

    if (!gammaResponse.ok) {
      throw new Error(`Gamma API HTTP ${gammaResponse.status}: ${gammaResponse.statusText}`);
    }

    const market = await gammaResponse.json();
    const tokenIds = extractTokenIds(market);
    
    if (!tokenIds) {
      return NextResponse.json(
        { error: 'Could not extract token IDs from market' },
        { status: 400 }
      );
    }

    // Fetch prices for both YES and NO tokens
    const [yesPrice, noPrice] = await Promise.all([
      getTokenPrice(tokenIds.yesTokenId),
      getTokenPrice(tokenIds.noTokenId)
    ]);

    if (!yesPrice || !noPrice) {
      return NextResponse.json(
        { error: 'Could not fetch prices for one or both tokens' },
        { status: 500 }
      );
    }

    const priceData = {
      marketId,
      yesPrice: yesPrice.price,
      noPrice: noPrice.price,
      yesSize: yesPrice.size,
      noSize: noPrice.size,
      spread: Math.abs(yesPrice.price - (1 - noPrice.price)),
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    setCachedPrice(marketId, priceData);

    return NextResponse.json(priceData);

  } catch (error) {
    console.error('Error fetching market prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market prices' },
      { status: 500 }
    );
  }
}

// Support batch price fetching for multiple markets
export async function POST(request: NextRequest) {
  try {
    const { marketIds } = await request.json();
    
    if (!Array.isArray(marketIds) || marketIds.length === 0) {
      return NextResponse.json(
        { error: 'marketIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      marketIds.map(async (marketId) => {
        // Check cache first
        const cached = getCachedPrice(marketId);
        if (cached) {
          return { marketId, ...cached };
        }

        // Fetch fresh price data
        const priceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/polymarket/price?marketId=${marketId}`
        );
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          setCachedPrice(marketId, priceData);
          return priceData;
        }
        
        throw new Error(`Failed to fetch price for ${marketId}`);
      })
    );

    const prices = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    return NextResponse.json({
      prices,
      errors: errors.length > 0 ? errors : undefined,
      count: prices.length
    });

  } catch (error) {
    console.error('Error fetching batch prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch prices' },
      { status: 500 }
    );
  }
}