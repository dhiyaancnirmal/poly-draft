# RTDS WebSocket Implementation

This document describes the implementation of the RTDS (Real-Time Data Service) WebSocket integration for comprehensive market updates and crypto price data in the Polymarket API integration.

## Overview

The RTDS WebSocket provides real-time market updates and crypto price feeds that complement the existing CLOB WebSocket, creating a comprehensive real-time data system for PolyDraft.

## Architecture

### Core Components

1. **RTDS WebSocket Types** (`lib/api/rtds-websocket.ts`)
   - TypeScript interfaces for RTDS WebSocket messages
   - Connection state and data state management types
   - Market update and crypto price update types

2. **RTDS WebSocket Client** (`lib/api/rtds-websocket-client.ts`)
   - WebSocket connection management for wss://ws-live-data.polymarket.com
   - Automatic reconnection with exponential backoff
   - Subscription management for multiple channels
   - Heartbeat/ping-pong handling
   - Error handling and state management

3. **React Hook** (`lib/hooks/useRTDSWebSocket.ts`)
   - React integration for RTDS WebSocket client
   - Market and crypto price state management
   - Automatic subscription based on configuration
   - Connection lifecycle management
   - Data synchronization helpers

4. **Enhanced Integration** (`lib/hooks/usePolymarket.ts`)
   - Combined CLOB + RTDS data synchronization
   - Enhanced market data with multiple sources
   - Unified connection status indicators

## Features

### Connection Management
- **Auto-connect**: Automatically connects when component mounts
- **Reconnection**: Automatic reconnection with exponential backoff (up to 5 attempts)
- **Heartbeat**: Maintains connection with 30-second ping intervals
- **Visibility handling**: Reconnects when tab becomes visible again
- **Graceful degradation**: Continues working with partial data sources

### Market Updates
- **Real-time market data**: New markets, updates, resolutions, closures
- **Market metadata**: Question changes, description updates, category changes
- **Price synchronization**: Complements CLOB token prices with market-level updates
- **Status tracking**: Active/inactive/resolved/closed status changes

### Crypto Price Updates
- **Live crypto prices**: Real-time cryptocurrency price feeds
- **Market data**: 24h changes, volume, market cap
- **Multiple symbols**: Support for BTC, ETH, and other major cryptocurrencies
- **Price history**: Timestamp tracking for price movements

### Data Synchronization
- **Multi-source integration**: Combines CLOB and RTDS data sources
- **Conflict resolution**: Intelligent merging of data from multiple sources
- **Consistency**: Ensures data consistency across different WebSocket feeds
- **Fallback behavior**: Graceful degradation when sources are unavailable

## Usage

### Basic RTDS Usage

```typescript
import { useRTDSWebSocket } from '@/lib/hooks/useRTDSWebSocket';

function MyComponent() {
  const {
    connected,
    connecting,
    error,
    marketUpdates,
    cryptoPrices,
    lastMarketUpdate,
    lastCryptoUpdate,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getMarketUpdate,
    getCryptoPrice
  } = useRTDSWebSocket({
    autoConnect: true,
    autoSubscribe: true,
    channels: ['markets', 'crypto_prices'],
    filters: { active_only: true }
  });

  return (
    <div>
      <div>RTDS: {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}</div>
      <div>Last Market Update: {lastMarketUpdate ? new Date(lastMarketUpdate).toLocaleTimeString() : 'Never'}</div>
      <div>Last Crypto Update: {lastCryptoUpdate ? new Date(lastCryptoUpdate).toLocaleTimeString() : 'Never'}</div>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### Synchronized Data Usage

```typescript
import { useSynchronizedMarketData } from '@/lib/hooks/useRTDSWebSocket';

function MarketListComponent({ markets }) {
  const {
    connected,
    synchronizedMarkets,
    getFullySynchronizedMarket,
    clobConnected,
    rtdsConnected
  } = useSynchronizedMarketData(markets);

  return (
    <div>
      <div>CLOB: {clobConnected ? '✓' : '✗'}</div>
      <div>RTDS: {rtdsConnected ? '✓' : '✗'}</div>
      <div>Full Sync: {connected ? '✓' : '✗'}</div>
      
      {synchronizedMarkets.map(market => (
        <MarketCard
          key={market.id}
          market={getFullySynchronizedMarket(market)}
          isLive={clobConnected}
          rtdsConnected={rtdsConnected}
        />
      ))}
    </div>
  );
}
```

### Advanced Configuration

```typescript
const advancedConfig = {
  autoConnect: true,
  autoSubscribe: true,
  channels: ['markets', 'crypto_prices'],
  filters: {
    categories: ['crypto', 'politics'],
    active_only: true,
    symbols: ['BTC', 'ETH', 'SOL']
  },
  reconnectOnVisibilityChange: true,
  config: {
    reconnectAttempts: 10,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    maxReconnectDelay: 60000,
    enableHeartbeat: true
  }
};

const rtds = useRTDSWebSocket(advancedConfig);
```

## WebSocket Message Format

### Subscription Message
```json
{
  "type": "subscribe",
  "channels": ["markets", "crypto_prices"],
  "filters": {
    "categories": ["crypto", "politics"],
    "active_only": true,
    "symbols": ["BTC", "ETH"]
  }
}
```

### Market Update Message
```json
{
  "type": "market_update",
  "data": [
    {
      "market_id": "0x1234567890abcdef",
      "question": "Will BTC reach $100k by end of 2024?",
      "description": "This market resolves to YES if Bitcoin reaches $100,000 USD...",
      "outcomes": ["YES", "NO"],
      "outcome_prices": [0.65, 0.35],
      "end_time": "2024-12-31T23:59:59Z",
      "active": true,
      "resolved": false,
      "volume": "1500000",
      "liquidity": "250000",
      "tags": ["crypto", "bitcoin"],
      "category": "crypto",
      "timestamp": 1640995200000,
      "update_type": "updated"
    }
  ]
}
```

### Crypto Price Update Message
```json
{
  "type": "crypto_price_update",
  "data": [
    {
      "symbol": "BTC",
      "price": 67500.50,
      "change_24h": 2.5,
      "volume_24h": 25000000000,
      "market_cap": 1320000000000,
      "timestamp": 1640995200000
    }
  ]
}
```

### Heartbeat Message
```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000
}
```

### Error Message
```json
{
  "type": "error",
  "message": "Subscription failed",
  "code": "INVALID_CHANNEL",
  "details": {
    "channel": "invalid_channel",
    "valid_channels": ["markets", "crypto_prices"]
  }
}
```

## Configuration Options

### RTDSWebSocketClient Options
```typescript
{
  reconnectAttempts: 5,        // Max reconnection attempts
  reconnectDelay: 2000,       // Initial reconnection delay (ms)
  heartbeatInterval: 30000,    // Ping interval (ms)
  maxReconnectDelay: 60000,   // Maximum reconnection delay (ms)
  enableHeartbeat: true        // Enable heartbeat/ping-pong
}
```

### Hook Options
```typescript
{
  autoConnect: true,                    // Auto-connect on mount
  autoSubscribe: true,                  // Auto-subscribe to channels
  channels: ['markets', 'crypto_prices'], // Channels to subscribe to
  filters: {                           // Subscription filters
    categories?: string[],              // Market categories to filter
    active_only?: boolean,            // Only active markets
    symbols?: string[]                // Crypto symbols to track
  },
  reconnectOnVisibilityChange: true,     // Reconnect on tab visibility change
  config: RTDSWebSocketConfig          // Client configuration
}
```

## Data Synchronization

### Multi-Source Integration

The RTDS system is designed to work alongside the existing CLOB WebSocket:

1. **CLOB WebSocket**: Provides real-time token price updates
2. **RTDS WebSocket**: Provides market-level updates and crypto prices
3. **Synchronization Layer**: Merges data from both sources intelligently

### Data Priority

1. **Market Metadata**: RTDS takes priority (more comprehensive)
2. **Token Prices**: CLOB takes priority (more granular)
3. **Status Updates**: RTDS takes priority (market-level status)
4. **Crypto Prices**: RTDS exclusive (not available in CLOB)

### Conflict Resolution

- **Timestamp-based**: Use most recent timestamp for conflicting data
- **Source-specific**: Trust specific sources for specific data types
- **Manual override**: Allow manual preference setting

## Error Handling

### Connection Errors
- Network failures trigger automatic reconnection
- Exponential backoff prevents server overload
- Maximum retry limits prevent infinite loops
- Graceful degradation to partial functionality

### Data Errors
- Malformed messages are logged but don't crash the connection
- Invalid data is ignored with warnings
- Missing fields are handled with defaults
- Data validation prevents corruption

### UI Error States
- Connection status shown in UI components
- Error messages displayed to users
- Fallback to cached data when available
- Progressive enhancement approach

## Performance Considerations

### Optimization
- Data update throttling to prevent excessive re-renders
- Efficient data structures (Map for O(1) lookups)
- Minimal re-renders with proper state management
- Lazy loading and pagination for large datasets

### Memory Management
- Automatic cleanup of subscriptions
- Cleanup of event listeners
- Cache size limits with LRU eviction
- Garbage collection optimization

### Network Efficiency
- Batch message processing
- Compression support
- Connection pooling
- Request deduplication

## Testing

### Manual Testing
```bash
# Test RTDS connection
node test-rtds.js
```

### Integration Testing
- Test connection establishment
- Test market update reception
- Test crypto price updates
- Test reconnection logic
- Test data synchronization
- Test error handling

### Performance Testing
- Connection latency measurement
- Message throughput testing
- Memory usage monitoring
- UI responsiveness testing

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check network connectivity
   - Verify WebSocket URL is correct
   - Check for CORS issues in development
   - Verify firewall/proxy settings

2. **No Market Updates**
   - Verify subscription channels are correct
   - Check if filters are too restrictive
   - Verify market IDs are valid
   - Check subscription messages are sent

3. **No Crypto Updates**
   - Verify crypto symbols are correct
   - Check if symbols are supported
   - Verify subscription includes 'crypto_prices' channel

4. **Data Synchronization Issues**
   - Check timestamp consistency
   - Verify data source priorities
   - Check for conflicting updates
   - Verify merge logic

### Debug Logging
- Enable console logging for WebSocket events
- Monitor connection state changes
- Track message frequency and types
- Log data synchronization events

## Future Enhancements

### Potential Improvements
1. **Historical Data**: Store and query historical market data
2. **Price Alerts**: Notify users of significant market changes
3. **Advanced Filtering**: More sophisticated market filtering options
4. **Offline Support**: Cache data for offline viewing
5. **Performance Metrics**: Track connection and data performance

### Scalability
1. **Connection Pooling**: Share connections across components
2. **Load Balancing**: Distribute subscriptions across connections
3. **Data Partitioning**: Partition data by category or type
4. **Caching Strategy**: Optimize data caching and invalidation

## Security Considerations

### WebSocket Security
- Use secure WebSocket connections (wss://)
- Validate incoming message format
- Sanitize data before use
- Implement rate limiting

### Data Privacy
- No sensitive data transmitted
- Market data is public information
- Crypto prices are public data
- No user authentication required

## API Reference

### RTDSWebSocketClient
- `connect()`: Connect to WebSocket
- `disconnect()`: Disconnect from WebSocket
- `subscribe(channels, filters)`: Subscribe to data channels
- `unsubscribe(channels)`: Unsubscribe from data channels
- `getState()`: Get current connection state
- `getDataState()`: Get current data state
- `getMarketUpdate(marketId)`: Get specific market update
- `getCryptoPrice(symbol)`: Get specific crypto price
- `onMarketUpdate(callback)`: Register market update callback
- `onCryptoPriceUpdate(callback)`: Register crypto price callback
- `onStateChange(callback)`: Register state change callback

### useRTDSWebSocket Hook
- Returns connection state, data state, and control functions
- Automatically manages connection lifecycle
- Handles subscription management
- Provides data synchronization helpers

### useSynchronizedMarketData Hook
- Combines CLOB and RTDS data sources
- Returns fully synchronized market data
- Handles data conflicts intelligently
- Provides unified connection status

## Integration with Existing Components

### MarketCard Enhancement
- Added RTDS connection indicator
- Shows data source status
- Displays synchronized data when available
- Graceful fallback to single source

### Draft Page Integration
- Combined connection status display
- Enhanced market filtering
- Real-time data synchronization
- Improved error handling

### Dev Settings Integration
- Toggle RTDS connection
- Configure subscription filters
- Monitor connection status
- Debug data synchronization

---

**Document Version**: 1.0
**Last Updated**: December 3, 2024
**Related Documents**: 
- [CLOB WebSocket Implementation](./CLOB_WEBSOCKET.md)
- [Polymarket API Reference](./POLYMARKET_API.md)