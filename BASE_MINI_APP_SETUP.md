# PolyDraft - Base Mini App Setup

This project is configured as a Base mini app for fantasy sports drafting on the Base blockchain.

## Base Mini App Configuration

The project includes:

1. **MiniKit Configuration**: `minikit.config.ts` - Configures the mini app manifest
2. **Manifest File**: `app/.well-known/farcaster.json` - The mini app manifest
3. **Webhook Endpoint**: `app/api/webhook/route.ts` - Handles Base app notifications
4. **Required Assets**: Icon, splash screen, and hero images in `/public`

## Next Steps for Deployment

1. **Deploy to Vercel**:
   ```bash
   npm run build
   # Deploy to Vercel
   ```

2. **Update ROOT_URL**:
   - Set `ROOT_URL` environment variable to your deployed URL
   - Update `minikit.config.ts` with the production URL

3. **Generate Account Association**:
   - Visit [Base Build Account Association](https://www.base.dev/preview?tab=account)
   - Enter your app URL and generate credentials
   - Update `accountAssociation` in `minikit.config.ts`

4. **Test Your App**:
   - Go to [base.dev/preview](https://base.dev/preview)
   - Enter your app URL to test the mini app

5. **Publish**:
   - Create a post in the Base app with your app URL to publish

## Required Files for Base Mini App

✅ `minikit.config.ts` - MiniKit configuration  
✅ `app/.well-known/farcaster.json` - Manifest file  
✅ `app/api/webhook/route.ts` - Webhook endpoint  
✅ Public assets (icon, splash, hero images)  
✅ `@farcaster/miniapp-sdk` dependency  

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000` and the manifest at `http://localhost:3000/.well-known/farcaster.json`.