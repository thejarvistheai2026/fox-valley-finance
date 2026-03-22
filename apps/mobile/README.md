# Fox Valley Finance Tracker - Mobile App

A React Native mobile app built with Expo for capturing receipts and managing expenses during home construction.

## Features

- **Magic Link Authentication** - Secure, passwordless login via Supabase
- **Receipt Capture** - Take photos with camera or select from gallery
- **OCR Processing** - Extract receipt data using Supabase Edge Functions + Claude API
- **Vendor Management** - Search vendors, create new vendors on-the-fly
- **Inbox View** - See captured receipts waiting for web/iPad processing
- **Read-Only Views** - View vendor details and receipt details

## Tech Stack

- **Framework**: Expo (React Native)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Auth**: Supabase Auth (Magic Link)
- **Database**: Supabase (PostgreSQL)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Camera**: expo-camera
- **Image Handling**: expo-image-picker, expo-image-manipulator

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # Screen components
│   ├── AuthScreen.tsx         # Magic link login
│   ├── HomeScreen.tsx         # Quick actions (capture, search)
│   ├── SearchScreen.tsx       # Vendor search and list
│   ├── InboxScreen.tsx        # Captured receipts inbox
│   ├── CaptureScreen.tsx      # Camera/gallery + vendor select
│   ├── ReviewScreen.tsx       # OCR review and save
│   ├── VendorDetailScreen.tsx # Read-only vendor info
│   └── ReceiptDetailScreen.tsx # Read-only receipt info
├── navigation/     # Navigation configuration
├── lib/             # Utilities and API clients
│   └── supabase.ts  # Supabase client and queries
├── hooks/           # Custom React hooks
│   └── useAuth.ts   # Authentication state
└── types/           # TypeScript definitions
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Key Features

### Capture Flow
1. Tap "Capture Receipt" from Home or Inbox
2. Select/create vendor (name + type only)
3. Take photo or pick from gallery
4. Image is compressed (max 2000px, JPEG 80%)
5. Sent to OCR Edge Function
6. Review extracted data in form
7. Save to inbox

### Offline Handling
- Receipts save to inbox even if OCR fails
- Manual entry fallback always available
- Image is always stored regardless of OCR success

### Constraints
- **Read-only** for vendor/receipt viewing (per PRD)
- **No estimate linking** on mobile (deferred to web)
- **No dashboard** or CSV export (web features)
- **Minimum viable data** at capture (detailed processing on web)

## Running on Device

### iOS
```bash
npx expo run:ios
```

### Android
```bash
npx expo run:android
```

### Development Build
```bash
npx expo prebuild
```

## Build for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Supabase Setup

Required tables (from PRD):
- `vendors` - Vendor information
- `receipts` - Receipt data with `status` field (inbox/confirmed)
- `estimates` - Estimate data (for vendor detail view)
- `documents` - Receipt images

Required Edge Function:
- `process-receipt` - OCR receipt processing via Claude API

## License

Private - For Fox Valley home build project