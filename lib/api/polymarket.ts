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
  const { title, category } = event;

  // Use explicit category first
  if (category) {
    const normalizedCategory = category.toLowerCase();
    for (const value of Object.values(MARKET_CATEGORIES)) {
      if (normalizedCategory.includes(value)) {
        return value as MarketCategory;
      }
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
      titleLower.includes('crypto') || titleLower.includes('coin')) {
    return MARKET_CATEGORIES.CRYPTO;
  }

  // Finance patterns
  if (titleLower.includes('s&p') || titleLower.includes('stock') ||
      titleLower.includes('nasdaq') || titleLower.includes('dow') ||
      titleLower.includes('index')) {
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
      titleLower.includes('apple') || titleLower.includes('google')) {
    return MARKET_CATEGORIES.TECHNOLOGY;
  }

  // Business patterns
  if (titleLower.includes('earnings') || titleLower.includes('revenue') ||
      titleLower.includes('profit') || titleLower.includes('sales')) {
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
      titleLower.includes('score') || titleLower.includes('season')) {
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

    // Format date as "December 5" (what Polymarket uses in titles)
    const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    console.log(`Searching markets for "${dateString}"...`);

    // Use Polymarket's search API - it does all the heavy lifting
    const searchQuery = `"${dateString}"`;
    const url = `${POLYMARKET_API}/public-search?q=${encodeURIComponent(searchQuery)}&limit=100&sort=volume&ascending=false&events_status=open`;
    const cacheKey = `search-${dateString}`;

    const response: SearchResponse = await fetchWithCache(url, cacheKey);
    const events = response?.events || [];

    console.log(`Found ${events.length} markets for ${dateString}`);

    if (events.length === 0) {
      return [];
    }

    // Select diverse markets - O(n) single pass
    return selectDiverseMarkets(events, 10);
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
