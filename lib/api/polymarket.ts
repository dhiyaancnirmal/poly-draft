import { PolymarketEvent, PolymarketMarket, MarketSelection, MARKET_CATEGORIES, MarketCategory } from '@/lib/types/polymarket';

// Export types for use in hooks
export type { MarketSelection };

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

// Category detection from market data
export function detectMarketCategory(event: PolymarketEvent): MarketCategory {
  const { title, category, categories, tags } = event;

  // Prefer native Polymarket categories/tags when available
  const candidateCategories = [
    category,
    ...(categories || []).map((c) => c.label || c.slug),
    ...(tags || []).map((t) => t.label || t.slug),
  ]
    .filter(Boolean)
    .map((c) => c!.toLowerCase());

  for (const candidate of candidateCategories) {
    for (const value of Object.values(MARKET_CATEGORIES)) {
      if (candidate.includes(value)) {
        return value as MarketCategory;
      }
    }

    // Explicit category hints
    if (candidate.includes('sports') || candidate.includes('nfl') || candidate.includes('nba')) {
      return MARKET_CATEGORIES.SPORTS;
    }
    if (candidate.includes('crypto') || candidate.includes('defi')) {
      return MARKET_CATEGORIES.CRYPTO;
    }
    if (candidate.includes('finance') || candidate.includes('markets')) {
      return MARKET_CATEGORIES.FINANCE;
    }
  }

  // Fallback to keyword detection in title
  const titleLower = title.toLowerCase();

  // Weather patterns
  if (titleLower.includes('weather') || titleLower.includes('rain') ||
      titleLower.includes('temperature') || titleLower.includes('snow')) {
    return MARKET_CATEGORIES.WEATHER;
  }

  // Crypto patterns
  if (titleLower.includes('bitcoin') || titleLower.includes('btc') ||
      titleLower.includes('ethereum') || titleLower.includes('eth') ||
      titleLower.includes('crypto') || titleLower.includes('coin') ||
      titleLower.includes('solana') || titleLower.includes('sol') ||
      titleLower.includes('doge') || titleLower.includes('token')) {
    return MARKET_CATEGORIES.CRYPTO;
  }

  // Finance patterns
  if (titleLower.includes('s&p') || titleLower.includes('stock') ||
      titleLower.includes('nasdaq') || titleLower.includes('dow') ||
      titleLower.includes('index') || titleLower.includes('interest') ||
      titleLower.includes('inflation') || titleLower.includes('treasury') ||
      titleLower.includes('bond') || titleLower.includes('rate') ||
      titleLower.includes('fed')) {
    return MARKET_CATEGORIES.FINANCE;
  }

  // Politics patterns
  if (titleLower.includes('election') || titleLower.includes('trump') ||
      titleLower.includes('biden') || titleLower.includes('congress') ||
      titleLower.includes('senate') || titleLower.includes('president')) {
    return MARKET_CATEGORIES.POLITICS;
  }

  // Technology patterns
  if (titleLower.includes('elon') || titleLower.includes('musk') ||
      titleLower.includes('twitter') || titleLower.includes('tesla') ||
      titleLower.includes('apple') || titleLower.includes('google') ||
      titleLower.includes('ai') || titleLower.includes('openai') ||
      titleLower.includes('nvidia') || titleLower.includes('chip')) {
    return MARKET_CATEGORIES.TECHNOLOGY;
  }

  // Business patterns
  if (titleLower.includes('earnings') || titleLower.includes('revenue') ||
      titleLower.includes('profit') || titleLower.includes('sales') ||
      titleLower.includes('ipo') || titleLower.includes('merger') ||
      titleLower.includes('acquisition')) {
    return MARKET_CATEGORIES.BUSINESS;
  }

  // Science patterns
  if (titleLower.includes('covid') || titleLower.includes('vaccine') ||
      titleLower.includes('climate') || titleLower.includes('science')) {
    return MARKET_CATEGORIES.SCIENCE;
  }

  // Sports patterns
  if (titleLower.includes('game') || titleLower.includes('match') ||
      titleLower.includes('team') || titleLower.includes('win') ||
      titleLower.includes('score') || titleLower.includes('season') ||
      titleLower.includes('nfl') || titleLower.includes('nba') ||
      titleLower.includes('mlb') || titleLower.includes('nhl') ||
      titleLower.includes('soccer') || titleLower.includes('football') ||
      titleLower.includes('fifa') || titleLower.includes('world cup') ||
      titleLower.includes('olympics')) {
    return MARKET_CATEGORIES.SPORTS;
  }

  return MARKET_CATEGORIES.OTHER;
}

// Parse outcomePrices that can arrive as JSON string or array
function parseOutcomePrices(outcomePrices: any): number[] | null {
  try {
    if (typeof outcomePrices === 'string') {
      try {
        const parsed = JSON.parse(outcomePrices);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => parseFloat(p)).filter((p) => !Number.isNaN(p));
        }
      } catch {
        // Not JSON, fall through to CSV parsing
        const split = outcomePrices.split(',').map((p) => parseFloat(p.trim())).filter((p) => !Number.isNaN(p));
        if (split.length >= 2) {
          return split;
        }
      }
    } else if (Array.isArray(outcomePrices)) {
      return outcomePrices.map((p) => parseFloat(p)).filter((p) => !Number.isNaN(p));
    }
  } catch (error) {
    console.warn('Failed to parse outcomePrices', error);
  }
  return null;
}

// Normalize raw market payload into our typed shape
function normalizeMarket(raw: any, outcomePrices: number[], outcomes: string[], endTime: string): PolymarketMarket {
  return {
    id: String(raw.id),
    question: raw.question || raw.title || raw.slug || 'Untitled market',
    conditionId: raw.conditionId ?? raw.condition_id ?? '',
    slug: raw.slug ?? String(raw.id),
    endDate: endTime,
    category: raw.category,
    liquidity: raw.liquidity?.toString(),
    volume: (raw.volume ?? raw.volume24hr ?? 0).toString(),
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    clobTokenIds: Array.isArray(raw.clobTokenIds)
      ? raw.clobTokenIds.join(',')
      : raw.clobTokenIds,
    description: raw.description ?? raw.subtitle,
    resolutionSource: raw.resolutionSource,
    marketType: raw.marketType,
    formatType: raw.formatType,
    liquidityNum: raw.liquidityNum,
    volume24hr: raw.volume24hr,
    volume1wk: raw.volume1wk,
    volume1mo: raw.volume1mo,
    volume1yr: raw.volume1yr,
    outcomes: outcomes.join(','),
    outcomePrices: outcomePrices.map((p) => p.toString()).join(','),
  } as PolymarketMarket;
}

// Build a minimal event wrapper from a market so downstream consumers keep working
function buildEventFromMarket(raw: any, market: PolymarketMarket, endTime: string): PolymarketEvent {
  return {
    id: raw.eventId ? String(raw.eventId) : String(raw.id),
    slug: raw.slug ?? String(raw.id),
    title: raw.question || raw.title || 'Polymarket Market',
    description: raw.description ?? raw.subtitle,
    endDate: endTime,
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    liquidity: raw.liquidityNum ?? raw.liquidity,
    volume: Number(raw.volume ?? raw.volume24hr ?? 0),
    volume24hr: Number(raw.volume24hr ?? raw.volume ?? 0),
    tags: raw.tags,
    categories: raw.categories,
    markets: [market],
  } as PolymarketEvent;
}

// Fetch markets ending within 7 days and return top 20 by 24h volume
export async function fetchDailyMarkets(targetDate?: Date): Promise<MarketSelection[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowStart = targetDate ? new Date(targetDate) : today;
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowStart.getDate() + 7);
    windowEnd.setHours(23, 59, 59, 999);

    // Never include markets that have already ended before "today"
    const lowerBound = windowStart > today ? windowStart : today;

    const limit = 500;
    let offset = 0;
    const allMarkets: any[] = [];
    const seenIds = new Set<string>();

    while (true) {
      const apiUrl = new URL(`${POLYMARKET_API}/markets`);
      apiUrl.searchParams.set('closed', 'false');
      apiUrl.searchParams.set('limit', String(limit));
      apiUrl.searchParams.set('offset', String(offset));

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'PolyDraft/1.0',
        },
        cache: 'no-store', // Disable Next.js caching for large responses
      });

      if (!response.ok) {
        console.error(`Polymarket fetch failed at offset ${offset}: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const market of data) {
        const id = String(market.id);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allMarkets.push(market);
        }
      }

      if (data.length < limit) {
        break;
      }

      offset += limit;
    }

    const filtered = allMarkets
      .map((market) => {
        const endTime: string | undefined = market.endTime || market.endDateIso || market.endDate;
        if (!endTime) return null;

        const endDate = new Date(endTime);
        if (Number.isNaN(endDate.getTime())) return null;

        // Must be active, not closed, ending after lowerBound and within 7 days
        if (!(market.active === true && market.closed !== true)) return null;
        if (endDate <= lowerBound || endDate > windowEnd) return null;

        // Parse prices
        const parsedOutcomePrices = parseOutcomePrices(market.outcomePrices);
        if (!parsedOutcomePrices || parsedOutcomePrices.length < 2) return null;

        const [yesPrice, noPrice] = parsedOutcomePrices;
        // Skip if prices are outside the 15%–85% band to avoid extreme odds
        const outOfRange = [yesPrice, noPrice].some((p) => p < 0.15 || p > 0.85);
        if (outOfRange) return null;

        const outcomesArray: string[] = Array.isArray(market.outcomes)
          ? market.outcomes.map((o: any) => String(o))
          : typeof market.outcomes === 'string'
            ? market.outcomes.split(',').map((o: string) => o.trim())
            : ['Yes', 'No'];

        const normalizedMarket = normalizeMarket(market, parsedOutcomePrices, outcomesArray, endTime);
        const event = buildEventFromMarket(market, normalizedMarket, endTime);
        const category = detectMarketCategory(event);

        return {
          event,
          market: normalizedMarket,
          category,
          confidence: 100,
          sortVolume: Number(market.volume24hr ?? market.volume ?? 0),
        };
      })
      .filter(Boolean) as Array<MarketSelection & { sortVolume: number }>;

    const topMarkets = filtered
      .sort((a, b) => b.sortVolume - a.sortVolume)
      .slice(0, 20)
      .map(({ sortVolume, ...rest }) => rest);

    return topMarkets;
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return [];
  }
}

// Utility to format volume for display
export function formatVolume(volume?: number | string | null): string {
  // Handle undefined, null, or invalid values
  if (volume === undefined || volume === null) {
    return '$0';
  }

  const num = typeof volume === 'string' ? parseFloat(volume) : volume;

  // Handle NaN or invalid numbers
  if (isNaN(num)) {
    return '$0';
  }

  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
}

// Utility to format end time
export function formatEndTime(endDate: string): string {
  const date = new Date(endDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else {
    return 'Soon';
  }
}
