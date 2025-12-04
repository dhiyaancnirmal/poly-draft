# Polymarket API Reference

**Last Updated**: December 3, 2024
**Official Docs**: https://docs.polymarket.com

This document contains comprehensive information about the Polymarket API for use in the PolyDraft project.

---

## Table of Contents
1. [Introduction](#introduction)
2. [CLOB (Central Limit Order Book)](#clob-central-limit-order-book)
3. [Gamma Markets API](#gamma-markets-api)
4. [Authentication](#authentication)
5. [API Clients](#api-clients)
6. [Market Endpoints](#market-endpoints)
7. [Orderbook Endpoints](#orderbook-endpoints)
8. [WebSocket Support](#websocket-support)
9. [Code Examples](#code-examples)
10. [Rate Limits](#rate-limits)

---

## Introduction

Polymarket is the world's largest prediction market platform. The API enables developers to:
- Fetch market data and pricing
- Place and manage orders
- Stream real-time market updates
- Query historical data

**Key Concept**: Prices on Polymarket represent probabilities determined by market supply and demand, not centrally set values.

---

## CLOB (Central Limit Order Book)

### What is CLOB?

Polymarket's CLOB is **hybrid-decentralized**:
- **Off-chain**: Operator handles order matching and ordering
- **On-chain**: Settlement happens on blockchain via signed order messages

### How It Works

**Architecture**:
- Custom contract facilitates atomic swaps between binary Outcome Tokens (CTF ERC1155 and ERC20 assets) and collateral
- Orders are cryptographically signed using EIP712 structured data

**Order Matching**:
- Matched orders have one maker and one or more takers
- Price improvements benefit the taker
- Operator manages off-chain order management
- Matched trades submitted to blockchain for execution

**Binary Markets**:
- System designed specifically for binary markets
- Complementary tokens can match across unified order book

### Security & Trust

- **Audited**: Exchange contract audited by Chainsecurity
- **Limited Operator Role**: Operators cannot set prices or execute unauthorized trades
- **User Control**: Users can independently cancel orders on-chain if needed
- **Zero Fees**: Currently 0% maker and taker fees for all volume levels

---

## Gamma Markets API

### Core Structure

The Gamma API organizes data into two fundamental components:

1. **Markets**: Trading data mapped to:
   - Token IDs
   - Market addresses
   - Question IDs
   - Condition IDs

2. **Events**: Organizational containers for related markets:
   - **SMPs**: Single Market Events
   - **GMPs**: Multiple Market Events

**Example**: "Where will Barron Trump attend College?" is an event containing 5 markets (Georgetown, NYU, UPenn, Harvard, Other).

### Base URL

```
https://gamma-api.polymarket.com
```

### Available Endpoint Categories

- **Health** - Status checks
- **Sports** - Team and metadata
- **Tags** - Market categorization
- **Events** - Event retrieval and management
- **Markets** - Market data access
- **Series** - Series information
- **Comments** - User comments
- **Search** - Cross-platform searching

---

## Authentication

### For CLOB Client

Authentication requires:
- **Host**: API endpoint URL
- **Private Key**: Your wallet's private key
- **Chain ID**: 137 (Polygon mainnet)

### Signature Types

1. **Standard EOA** (Default): `signature_type=0`
2. **Polymarket Proxy** (Email/Magic): `signature_type=1`
3. **Browser Wallet** (MetaMask, Coinbase): `signature_type=2`

---

## API Clients

### Official Clients

**TypeScript**:
```bash
npm install @polymarket/clob-client
```
Repository: https://github.com/Polymarket/clob-client

**Python**:
```bash
pip install py-clob-client
```
Repository: https://github.com/Polymarket/py-clob-client

### Python Client Setup

**Standard EOA**:
```python
from py_clob_client.client import ClobClient

host = "https://clob.polymarket.com"
key = "YOUR_PRIVATE_KEY"
chain_id = 137

client = ClobClient(host, key=key, chain_id=chain_id)
```

**Polymarket Proxy** (Email/Magic):
```python
client = ClobClient(
    host,
    key=key,
    chain_id=chain_id,
    signature_type=1,
    funder=POLYMARKET_PROXY_ADDRESS
)
```

**Browser Wallet**:
```python
client = ClobClient(
    host,
    key=key,
    chain_id=chain_id,
    signature_type=2,
    funder=POLYMARKET_PROXY_ADDRESS
)
```

### Order Utility Libraries

For programmatic order signing and generation:
- **TypeScript**: [clob-order-utils](https://github.com/Polymarket/clob-order-utils)
- **Python**: [python-order-utils](https://github.com/Polymarket/python-order-utils)
- **Go**: [go-order-utils](https://github.com/Polymarket/go-order-utils)

---

## Market Endpoints

### Three Main Fetching Strategies

1. **By Slug** - For specific individual markets/events
2. **By Tags** - For category or sport-based filtering
3. **Via Events** - Most efficient for all active markets (recommended)

### 1. Fetch by Slug

**Extract Slug**: Found in Polymarket URL after `/event/` or `/market/`

Example: `https://polymarket.com/event/fed-decision-in-october`
Slug: `fed-decision-in-october`

**Endpoints**:
```
GET /events/slug/{slug}
GET /markets/slug/{slug}
```

**Example**:
```bash
curl "https://gamma-api.polymarket.com/events/slug/fed-decision-in-october"
```

### 2. Fetch by Tags

**Discover Tags**:
```
GET /tags              # General tags
GET /sports            # Sports tags with metadata
```

**Filter by Tag**:
```
GET /events?tag_id={TAG_ID}&closed=false
GET /markets?tag_id={TAG_ID}&closed=false
```

**Additional Parameters**:
- `related_tags=true` - Include related tag markets
- `exclude_tag_id={ID}` - Remove specific tags

**Example**:
```bash
curl "https://gamma-api.polymarket.com/events?tag_id=100381&limit=1&closed=false"
```

### 3. Fetch All Active Markets

**Recommended**: Use `/events` endpoint (more efficient than `/markets`)

**Key Parameters**:
- `order=id` - Sort by event ID
- `ascending=false` - Newest first
- `closed=false` - Active markets only
- `limit` - Results per page (e.g., 50)
- `offset` - Pagination starting point

**Example**:
```bash
curl "https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=50&offset=0"
```

### Pagination

For large datasets, use `limit` and `offset`:

```
# Page 1
https://gamma-api.polymarket.com/events?limit=50&offset=0

# Page 2
https://gamma-api.polymarket.com/events?limit=50&offset=50

# Page 3
https://gamma-api.polymarket.com/events?limit=50&offset=100
```

### Response Structure (Event)

```typescript
interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  markets: Market[];
  tags: Tag[];
  closed: boolean;
  start_date: string;
  end_date: string;
  // ... additional fields
}

interface Market {
  id: string;
  question: string;
  condition_id: string;
  tokens: Token[];
  outcomes: string[];
  // ... additional fields
}
```

---

## Orderbook Endpoints

### Get Order Book Summary

Retrieves the order book summary for a specific token.

```
GET /book?token_id={TOKEN_ID}
```

**Parameters**:
- `token_id` (required): Token identifier

### Get Multiple Order Books

Batch request for multiple order books.

```
POST /books
```

**Body**:
```json
{
  "token_ids": ["TOKEN_ID_1", "TOKEN_ID_2", "TOKEN_ID_3"]
}
```

### Order Book Data Structure

```typescript
interface OrderBook {
  asset_id: string;
  market: string;
  bids: Order[];
  asks: Order[];
  timestamp: number;
}

interface Order {
  price: string;
  size: string;
}
```

---

## Pricing Endpoints

### Individual Market Price

```
GET /price?market_id={MARKET_ID}&side={SIDE}
```

**Parameters**:
- `market_id`: Market identifier
- `side`: "BUY" or "SELL"

### Bulk Pricing

```
POST /prices
```

**Body**:
```json
{
  "market_ids": ["MARKET_1", "MARKET_2"]
}
```

### Historical Prices

```
GET /prices/history?token_id={TOKEN_ID}&interval={INTERVAL}
```

**Parameters**:
- `token_id`: Token identifier
- `interval`: Time interval (e.g., "1h", "1d", "1w")

### Midpoint Prices

```
GET /midpoint?market_id={MARKET_ID}
```

---

## Order Management Endpoints

### Place Single Order

```
POST /order
```

**Body**:
```json
{
  "order": {
    "salt": "...",
    "maker": "0x...",
    "signer": "0x...",
    "taker": "0x0000000000000000000000000000000000000000",
    "tokenId": "...",
    "makerAmount": "...",
    "takerAmount": "...",
    "side": "BUY",
    "feeRateBps": "0",
    "nonce": "...",
    "expiration": "...",
    "signatureType": 0
  },
  "signature": "0x...",
  "orderType": "FOK"
}
```

### Place Batch Orders

```
POST /orders
```

### Get Order Status

```
GET /order/{ORDER_ID}
```

### Get Active Orders

```
GET /orders?market_id={MARKET_ID}&maker={MAKER_ADDRESS}
```

### Cancel Order

```
DELETE /order/{ORDER_ID}
```

### Cancel Multiple Orders

```
POST /cancel
```

**Body**:
```json
{
  "order_ids": ["ORDER_1", "ORDER_2", "ORDER_3"]
}
```

### Cancel All Market Orders

```
DELETE /orders?market_id={MARKET_ID}
```

---

## WebSocket Support

Real-time data streaming available through WebSocket connections.

### Connection

```javascript
const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com');
```

### Subscribe to Market

```json
{
  "type": "subscribe",
  "channel": "market",
  "market_id": "MARKET_ID"
}
```

### Subscribe to User Orders

```json
{
  "type": "subscribe",
  "channel": "user",
  "address": "0x..."
}
```

### Message Types

- `book_update` - Order book changes
- `trade` - Trade execution
- `price_change` - Price updates
- `order_update` - Order status changes

---

## Code Examples

### TypeScript: Fetch Active Markets

```typescript
const API_BASE = 'https://gamma-api.polymarket.com';

async function fetchActiveMarkets(limit = 50, offset = 0) {
  const url = `${API_BASE}/events?order=id&ascending=false&closed=false&limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Usage
const markets = await fetchActiveMarkets(10, 0);
console.log(markets);
```

### TypeScript: Fetch Market by Slug

```typescript
async function fetchMarketBySlug(slug: string) {
  const url = `${API_BASE}/events/slug/${slug}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Usage
const market = await fetchMarketBySlug('fed-decision-in-october');
```

### TypeScript: Fetch Markets by Category

```typescript
async function fetchMarketsByCategory(tagId: number, limit = 20) {
  const url = `${API_BASE}/events?tag_id=${tagId}&closed=false&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Usage - Crypto markets (tag_id = 100381)
const cryptoMarkets = await fetchMarketsByCategory(100381, 10);
```

### React Hook: Use Markets

```typescript
import { useState, useEffect } from 'react';

interface Market {
  id: string;
  title: string;
  slug: string;
  // ... other fields
}

export function usePolymarketMarkets(category?: number, limit = 20) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        const baseUrl = 'https://gamma-api.polymarket.com/events';
        const params = new URLSearchParams({
          closed: 'false',
          limit: limit.toString(),
          order: 'id',
          ascending: 'false',
        });

        if (category) {
          params.append('tag_id', category.toString());
        }

        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch markets');

        const data = await response.json();
        setMarkets(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, [category, limit]);

  return { markets, loading, error };
}
```

### Next.js Server Action: Fetch Markets

```typescript
'use server';

export async function getActiveMarkets(limit = 50, offset = 0) {
  const url = `https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=${limit}&offset=${offset}`;

  const response = await fetch(url, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error('Failed to fetch markets');
  }

  return response.json();
}
```

---

## Rate Limits

**Important**: "Rate limits are the same for all users, nobody has priority or increased limits."

### Best Practices

1. **Implement caching**: Cache responses for at least 30-60 seconds
2. **Use pagination**: Don't fetch all data at once
3. **Batch requests**: Use batch endpoints when possible
4. **WebSocket for real-time**: Use WebSocket instead of polling
5. **Respect 429 responses**: Back off when rate limited

### Recommended Caching Strategy

```typescript
// Cache market data for 1 minute
const CACHE_TTL = 60 * 1000; // 60 seconds

const cache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache(url: string) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();

  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

---

## Polymarket Builders Program

Enhanced capabilities for developers:
- Order attribution
- Signing servers
- Gasless transactions via Polygon relayers

**Learn more**: Contact Polymarket team for access

---

## Additional Resources

- **Official Docs**: https://docs.polymarket.com
- **TypeScript Client**: https://github.com/Polymarket/clob-client
- **Python Client**: https://github.com/Polymarket/py-clob-client
- **Discord Community**: https://discord.gg/polymarket
- **Twitter**: @polymarket

---

## Common Tag IDs

For quick reference when filtering markets:

```typescript
const POLYMARKET_TAGS = {
  CRYPTO: 100381,
  POLITICS: 100382,
  SPORTS: 100383,
  BUSINESS: 100384,
  SCIENCE: 100385,
  // Add more as discovered
};
```

---

## Notes for PolyDraft Integration

### Priority Endpoints for Our App

1. **GET /events** - Fetch all active markets for draft selection
2. **GET /events/slug/{slug}** - Get specific market details
3. **GET /tags** - Categorize markets for filtering
4. **WebSocket** - Real-time price updates during draft

### Data We Need to Store

- Market ID
- Market title/question
- Market slug (for URLs)
- Category/tags
- End date
- Current price/probability
- Token IDs (for YES/NO outcomes)

### Next Steps

1. Create API service layer in `/lib/api/polymarket.ts`
2. Implement caching strategy
3. Create React hooks for fetching markets
4. Add real market data toggle in dev settings
5. Replace dummy data with real Polymarket data

---

**Document Version**: 1.0
**Last Updated**: December 3, 2024
