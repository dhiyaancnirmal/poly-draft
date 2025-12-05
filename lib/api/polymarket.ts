import { PolymarketEvent, PolymarketMarket, MarketSelection, MARKET_CATEGORIES, MarketCategory } from '@/lib/types/polymarket';

// Export types for use in hooks
export type { MarketSelection };

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

// Category detection from market data
export function detectMarketCategory(event: PolymarketEvent): MarketCategory {
  const { title, category, categories, tags } = event;
  const SPORT_TEAM_KEYWORDS = [
    // NBA
    'lakers','celtics','suns','rockets','spurs','cavaliers','warriors','knicks','bulls','bucks',
    'heat','mavericks','clippers','kings','jazz','nuggets','timberwolves','grizzlies','blazers',
    'trail blazers','raptors','wizards','sixers','76ers','hawks','hornets','pistons','pacers',
    'magic','thunder','pelicans','nets',
    // NFL shorthand to strengthen detection on "vs" titles
    'patriots','chiefs','cowboys','eagles','steelers','giants','jets','bears','packers','ravens',
    'bills','browns','saints','vikings','dolphins','chargers','rams','raiders','niners','49ers',
    'bengals','broncos','texans','colts','jaguars','panthers','falcons','cardinals','commanders',
    'titans','seahawks','buccaneers','lions'
  ];

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
      titleLower.includes('olympics') ||
      SPORT_TEAM_KEYWORDS.some(team => titleLower.includes(team)) ||
      titleLower.includes(' vs ') || titleLower.includes(' vs. ') || titleLower.includes(' @ ')) {
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
    bestBid: raw.bestBid,
    bestAsk: raw.bestAsk,
    lastTradePrice: raw.lastTradePrice,
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
// Simple seeded shuffle (deterministic per seed)
function shuffleWithSeed<T>(items: T[], seed?: string): T[] {
  if (!items.length) return items;
  let s = 0;
  if (seed && seed.length) {
    for (let i = 0; i < seed.length; i++) {
      s = (s << 5) - s + seed.charCodeAt(i);
      s |= 0;
    }
  } else {
    s = Date.now();
  }
  // Mulberry32
  const mulberry32 = (a: number) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = mulberry32(s);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function fetchDailyMarkets(targetDate?: Date, seed?: string): Promise<MarketSelection[]> {
  try {
    // Target window: only markets ending tomorrow (UTC 00:00 -> 23:59:59.999)
    const base = targetDate ? new Date(targetDate) : new Date();
    const windowStart = new Date(Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate() + 1, // tomorrow UTC start
      0, 0, 0, 0
    ));
    const windowEnd = new Date(Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate() + 1, // tomorrow UTC end
      23, 59, 59, 999
    ));

    // Only include markets ending within the UTC window
    const lowerBound = windowStart;

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
        // Prefer full timestamp; fall back to date-only last
        const endTime: string | undefined = market.endTime || market.endDate || market.endDateIso;
        if (!endTime) return null;

        const endDate = new Date(endTime);
        if (Number.isNaN(endDate.getTime())) return null;

        // Must be active, not closed, ending tomorrow within the defined window
        if (!(market.active === true && market.closed !== true)) return null;
        // Accept any market ending between windowStart (inclusive) and windowEnd (inclusive)
        if (endDate < lowerBound || endDate > windowEnd) return null;

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

        // Skip non-binary markets (e.g., soccer with draw) or markets containing "draw"
        if (outcomesArray.length !== 2) return null;
        const hasDraw = outcomesArray.some((o) => o.toLowerCase().includes('draw'));
        if (hasDraw) return null;

        const normalizedMarket = normalizeMarket(market, parsedOutcomePrices, outcomesArray, endTime);
        const event = buildEventFromMarket(market, normalizedMarket, endTime);
        const category = detectMarketCategory(event);

        return {
          event,
          market: normalizedMarket,
          category,
          confidence: 100,
          sortVolume: Number(market.volume24hr ?? market.volume ?? 0),
          tokenIds: (() => {
            const raw = market.clobTokenIds;
            if (Array.isArray(raw)) return raw.map((t: any) => String(t).trim()).filter(Boolean);
            if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.map((t: any) => String(t).trim()).filter(Boolean);
              } catch {
                // not JSON, fall back to CSV
              }
              return raw.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            return [];
          })(),
        };
      })
      .filter(Boolean) as Array<MarketSelection & { sortVolume: number; tokenIds: string[]; market: any }>;

    // Fetch best BUY prices from CLOB for YES/NO tokens
    if (filtered.length > 0) {
      const priceParams: Array<{ token_id: string; side: 'BUY' }> = [];
      for (const item of filtered) {
        const tokenIds = item.tokenIds;
        if (tokenIds.length >= 2) {
          priceParams.push({ token_id: tokenIds[0], side: 'BUY' });
          priceParams.push({ token_id: tokenIds[1], side: 'BUY' });
        }
      }

      if (priceParams.length > 0) {
        try {
          const priceRes = await fetch('https://clob.polymarket.com/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ params: priceParams }),
          });

          if (priceRes.ok) {
            const priceData = await priceRes.json() as Record<string, { BUY?: string; SELL?: string }>;
            for (const item of filtered) {
              const tokenIds = item.tokenIds;
              if (tokenIds.length >= 2) {
                const yesBuy = priceData[tokenIds[0]]?.BUY;
                const noBuy = priceData[tokenIds[1]]?.BUY;
                const yesPriceNum = yesBuy ? Number(yesBuy) : undefined;
                const noPriceNum = noBuy ? Number(noBuy) : undefined;
                if (yesPriceNum !== undefined && !Number.isNaN(yesPriceNum)) {
                  item.market.bestBuyYesPrice = yesPriceNum;
                }
                if (noPriceNum !== undefined && !Number.isNaN(noPriceNum)) {
                  item.market.bestBuyNoPrice = noPriceNum;
                }
                // Also refresh outcomePrices to reflect the best BUY prices if both are present
                if (yesPriceNum !== undefined && noPriceNum !== undefined) {
                  item.market.outcomePrices = [yesPriceNum, noPriceNum].map((p) => p.toString()).join(',');
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch best BUY prices:', err);
        }
      }
    }

    // Enforce minimum category diversity: aim for at least 2 per category when available,
    // then fill remaining slots by highest volume.
    // Shuffle to diversify composition per request/seed
    const randomized = shuffleWithSeed(filtered, seed);

    const grouped = new Map<string, Array<MarketSelection & { sortVolume: number; tokenIds: string[]; market: any }>>();
    for (const item of randomized) {
      const cat = item.category || 'other';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    const MAX_RESULTS = 50;
    const selection: Array<MarketSelection & { sortVolume: number; tokenIds: string[] }> = [];

    // First pass: take up to 2 from each category (ensures diversity if available)
    for (const [, items] of grouped) {
      // Prefer earlier end times within the category
      const sortedByEnd = [...items].sort((a, b) => {
        const ea = new Date(a.market.endDate).getTime();
        const eb = new Date(b.market.endDate).getTime();
        return ea - eb;
      });
      const take = Math.min(2, sortedByEnd.length);
      selection.push(...sortedByEnd.slice(0, take));
    }

    // Second pass: fill remaining slots by overall volume
    if (selection.length < MAX_RESULTS) {
      const remainingPool = Array.from(grouped.values())
        .flatMap((items) => items)
        .filter((item) => !selection.includes(item));

      // Bucket remaining by end time quartiles to surface varied times
      const pooled = remainingPool.sort((a, b) => {
        const ea = new Date(a.market.endDate).getTime();
        const eb = new Date(b.market.endDate).getTime();
        return ea - eb;
      });

      const q1 = Math.ceil(pooled.length * 0.25);
      const q2 = Math.ceil(pooled.length * 0.50);
      const q3 = Math.ceil(pooled.length * 0.75);
      const buckets = [
        pooled.slice(0, q1),
        pooled.slice(q1, q2),
        pooled.slice(q2, q3),
        pooled.slice(q3),
      ].map((bucket, idx) => shuffleWithSeed(bucket, `${seed || ''}-bucket-${idx}`));

      const slotsLeft = MAX_RESULTS - selection.length;
      const roundRobin: typeof remainingPool = [];
      let added = 0;
      while (added < slotsLeft) {
        let progressed = false;
        for (const bucket of buckets) {
          if (bucket.length === 0) continue;
          const next = bucket.shift();
          if (next) {
            roundRobin.push(next);
            added += 1;
            progressed = true;
            if (added >= slotsLeft) break;
          }
        }
        if (!progressed) break; // all buckets empty
      }

      selection.push(...roundRobin);
    }

    // Keep output randomized but stable per seed
    const topMarkets = selection
      .slice(0, MAX_RESULTS)
      .map(({ sortVolume, tokenIds, ...rest }) => rest);

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

// Local timestamp string for display
export function formatLocalEndDate(endDate: string): string {
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
