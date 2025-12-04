import { PolymarketEvent, PolymarketMarket, SearchResponse, MarketSelection, MARKET_CATEGORIES, MarketCategory } from '@/lib/types/polymarket';

// Export types for use in hooks
export type { MarketSelection };

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

// Cache for API responses to respect rate limits
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

// Helper function for caching
function getCachedData(key: string): any | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// Generic fetch with caching and error handling
async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyDraft/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
}

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

// Fetch daily markets for tomorrow - simple and clean
export async function fetchDailyMarkets(targetDate?: Date): Promise<MarketSelection[]> {
  try {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = targetDate || tomorrow;

    // Format date for logging
    const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    console.log(`Fetching markets ending on "${dateString}"...`);

    // Get all active markets sorted by volume (no text search - most daily markets don't have dates in titles)
    const url = `${POLYMARKET_API}/events?closed=false&order=volume24hr&ascending=false&limit=500`;
    const cacheKey = `active-markets-${date.toISOString().split('T')[0]}`;

    const events = await fetchWithCache(url, cacheKey);
    console.log(`Fetched ${events.length} active markets`);

    // Filter for markets that END within 24 hours of the target date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const marketsEndingToday = events.filter((event: any) => {
      if (!event.endDate) return false;
      const endDate = new Date(event.endDate);
      return endDate >= startOfDay && endDate <= endOfDay;
    });

    console.log(`Found ${marketsEndingToday.length} markets ending on ${dateString}`);

    if (marketsEndingToday.length === 0) {
      console.log('No markets ending on target date, returning empty array');
      return [];
    }

    // Select diverse markets - O(n) single pass
    return selectDiverseMarkets(marketsEndingToday, 10);
  } catch (error) {
    console.error('Failed to fetch markets:', error);
    return [];
  }
}

// Select up to N markets with category diversity - O(n) time complexity
function selectDiverseMarkets(events: PolymarketEvent[], maxMarkets: number = 10): MarketSelection[] {
  const selectedMarkets: MarketSelection[] = [];
  const usedCategories = new Set<MarketCategory>();

  // Single pass through the results (already sorted by volume from API)
  for (const event of events) {
    // Stop if we have enough markets
    if (selectedMarkets.length >= maxMarkets) {
      break;
    }

    // Skip events without markets
    if (!event.markets || event.markets.length === 0) {
      continue;
    }

    const category = detectMarketCategory(event);

    // Prefer diverse categories, but allow duplicates if we run out of unique ones
    if (!usedCategories.has(category) || usedCategories.size >= Object.keys(MARKET_CATEGORIES).length) {
      const primaryMarket = event.markets[0];

      selectedMarkets.push({
        event,
        market: primaryMarket,
        category,
        confidence: 100 // Not needed anymore, but kept for type compatibility
      });

      usedCategories.add(category);
    }
  }

  // If we still need more markets and skipped some due to category duplicates, add them
  if (selectedMarkets.length < maxMarkets) {
    for (const event of events) {
      if (selectedMarkets.length >= maxMarkets) break;

      if (!event.markets || event.markets.length === 0) continue;

      // Check if we already added this event
      const alreadyAdded = selectedMarkets.some(m => m.event.id === event.id);
      if (alreadyAdded) continue;

      const primaryMarket = event.markets[0];
      const category = detectMarketCategory(event);

      selectedMarkets.push({
        event,
        market: primaryMarket,
        category,
        confidence: 100
      });
    }
  }

  return selectedMarkets;
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
