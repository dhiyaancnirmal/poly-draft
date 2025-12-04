# CLOB WebSocket Implementation

This document describes the implementation of the CLOB (Central Limit Order Book) WebSocket integration for live token price updates in the Polymarket API integration.

## Overview

The CLOB WebSocket provides real-time price updates for Polymarket tokens, enabling live percentage updates in the MarketCard components instead of static data.

## Architecture

### Core Components

1. **WebSocket Types** (`lib/api/websocket.ts`)
   - TypeScript interfaces for WebSocket messages
   - Connection state management types
   - Token-to-market mapping types

2. **CLOB WebSocket Client** (`lib/api/clob-websocket.ts`)
   - WebSocket connection management
   - Automatic reconnection with exponential backoff
   - Subscription management
   - Heartbeat/ping-pong handling
   - Error handling and state management

3. **React Hook** (`lib/hooks/useCLOBWebSocket.ts`)
   - React integration for WebSocket client
   - Live price state management
   - Automatic subscription based on market data
   - Connection lifecycle management

4. **Enhanced MarketCard** (`components/MarketCard.tsx`)
   - Live price display with visual indicators
   - Animated price updates
   - Connection status indicators

## Features

### Connection Management
- **Auto-connect**: Automatically connects when component mounts
- **Reconnection**: Automatic reconnection with exponential backoff (up to 5 attempts)
- **Heartbeat**: Maintains connection with 30-second ping intervals
- **Visibility handling**: Reconnects when tab becomes visible again

### Price Updates
- **Real-time updates**: Live price updates from CLOB WebSocket
- **Token mapping**: Maps token IDs to market IDs for price updates
- **Price smoothing**: Only updates on significant price changes (>0.001)
- **Fallback**: Uses static prices when WebSocket is unavailable

### UI Integration
- **Live indicators**: Visual indicators for live price data
- **Animated updates**: Smooth transitions for price changes
- **Connection status**: Shows connection state in UI
- **Error handling**: Graceful degradation on connection errors

## Usage

### Basic Usage

```typescript
import { useLiveMarketPrices } from '@/lib/hooks/useCLOBWebSocket';

function MyComponent() {
  const { markets, liveConnected, getMarketWithLivePrice } = useLiveMarketPrices(markets);
  
  return (
    <div>
      {markets.map(market => (
        <MarketCard
          key={market.id}
          market={getMarketWithLivePrice(market)}
          isLive={liveConnected}
        />
      ))}
    </div>
  );
}
```

### Advanced Usage

```typescript
import { useCLOBWebSocket } from '@/lib/hooks/useCLOBWebSocket';

function AdvancedComponent() {
  const {
    connected,
    connecting,
    error,
    livePrices,
    lastUpdate,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getPriceForMarket
  } = useCLOBWebSocket({
    autoConnect: true,
    markets: myMarkets,
    reconnectOnVisibilityChange: true
  });

  // Manual subscription
  useEffect(() => {
    if (connected) {
      subscribe(['token1', 'token2']);
    }
  }, [connected, subscribe]);

  return (
    <div>
      <div>Connection: {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}</div>
      <div>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</div>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## WebSocket Message Format

### Subscription Message
```json
{
  "type": "subscribe",
  "product_ids": ["17423", "17424"]
}
```

### Price Update Message
```json
{
  "type": "price_update",
  "data": [
    {
      "token_id": "17423",
      "price": 0.65,
      "timestamp": 1640995200000
    }
  ]
}
```

### Error Message
```json
{
  "type": "error",
  "message": "Subscription failed",
  "code": "INVALID_TOKEN"
}
```

## Configuration Options

### CLOBWebSocketClient Options
```typescript
{
  reconnectAttempts: 5,        // Max reconnection attempts
  reconnectDelay: 1000,       // Initial reconnection delay (ms)
  heartbeatInterval: 30000,    // Ping interval (ms)
  maxReconnectDelay: 30000    // Maximum reconnection delay (ms)
}
```

### Hook Options
```typescript
{
  autoConnect: true,                    // Auto-connect on mount
  markets: [],                          // Markets to subscribe to
  reconnectOnVisibilityChange: true      // Reconnect on tab visibility change
}
```

## Error Handling

### Connection Errors
- Network failures trigger automatic reconnection
- Exponential backoff prevents server overload
- Maximum retry limits prevent infinite loops

### Price Update Errors
- Malformed messages are logged but don't crash the connection
- Invalid price data is ignored
- Fallback to static prices when WebSocket fails

### UI Error States
- Connection status shown in UI
- Error messages displayed to users
- Graceful degradation to static data

## Performance Considerations

### Optimization
- Price update throttling (only updates on significant changes)
- Efficient token-to-market mapping
- Cleanup on component unmount
- Minimal re-renders with proper state management

### Memory Management
- Automatic cleanup of subscriptions
- Cleanup of event listeners
- Cache management for price data

## Testing

### Manual Testing
```bash
# Run the test script
node test-clob.js
```

### Integration Testing
- Test connection establishment
- Test price update reception
- Test reconnection logic
- Test error handling

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check network connectivity
   - Verify WebSocket URL is correct
   - Check for CORS issues in development

2. **No Price Updates**
   - Verify token IDs are correct
   - Check if markets have clobTokenIds
   - Verify subscription messages are sent

3. **Frequent Disconnections**
   - Check network stability
   - Verify heartbeat is working
   - Check server-side connection limits

### Debug Logging
- Enable console logging for WebSocket events
- Monitor connection state changes
- Track price update frequency

## Future Enhancements

### Potential Improvements
1. **Price History**: Store historical price data
2. **Price Alerts**: Notify users of significant price changes
3. **Batch Updates**: Group multiple price updates
4. **Offline Support**: Cache prices for offline viewing
5. **Performance Metrics**: Track connection performance

### Scalability
1. **Connection Pooling**: Share connections across components
2. **Load Balancing**: Distribute subscriptions across connections
3. **Rate Limiting**: Prevent excessive API calls
4. **Caching Strategy**: Optimize price data caching

## Security Considerations

### WebSocket Security
- Use secure WebSocket connections (wss://)
- Validate incoming message format
- Sanitize price data before use

### Data Privacy
- No sensitive data transmitted
- Price data is public information
- No user authentication required

## API Reference

### CLOBWebSocketClient
- `connect()`: Connect to WebSocket
- `disconnect()`: Disconnect from WebSocket
- `subscribe(tokenIds)`: Subscribe to token price updates
- `unsubscribe(tokenIds)`: Unsubscribe from token updates
- `getState()`: Get current connection state
- `onPriceUpdate(callback)`: Register price update callback
- `onStateChange(callback)`: Register state change callback

### useCLOBWebSocket Hook
- Returns connection state, live prices, and control functions
- Automatically manages connection lifecycle
- Handles subscription management

### useLiveMarketPrices Hook
- Simplified hook for market-specific price updates
- Returns enhanced market data with live prices
- Automatic subscription based on market list