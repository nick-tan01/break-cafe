# BREAK ☕️

*"I'm going on break to get a coffee — can I order you something?"*

BREAK is a mobile app for discovering nearby independent cafes and ordering ahead for pickup. Customers browse cafes on a list or map, check menus and hours, and place pickup orders; cafe owners get an admin portal with an order queue, menu management, and analytics.

Built with Expo (React Native + TypeScript) and Supabase.

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   ```bash
   cp .env.example .env
   # fill in your Supabase URL/anon key and Google OAuth client IDs
   ```

   All `EXPO_PUBLIC_*` variables are inlined into the client bundle at build time — never put server-side secrets (e.g. the Supabase service-role key) in this file. Restart the dev server after changing `.env`.

3. Start the app

   ```bash
   npx expo start
   ```

   Then open in an iOS simulator, Android emulator, or Expo Go.

## Environment variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe to ship **only if Row Level Security is enabled** on all tables |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID |
| `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` | OAuth redirect URI (auth.expo.io proxy) |

## Project structure

```
app/
  (auth)/        sign-in, sign-up (Supabase email/password + Google OAuth)
  (tabs)/        customer app: explore (list/map), search, orders, profile
  (cafe-admin)/  owner portal: login, dashboard, orders, menu, analytics
  cafe/[id]      cafe detail page
  checkout.tsx   cart review and order placement
lib/supabase.ts  Supabase client (configured via .env)
createDBscript.sql  reference schema (MySQL-flavored; live DB is Supabase/Postgres)
```

## Admin portal access

The owner portal (`/(cafe-admin)`) requires a real Supabase account that has a row in the `cafe_owners` table (`user_id` matching the Supabase auth user ID). Accounts without a `cafe_owners` row are signed out and denied access.

## Current state & roadmap

Working today: auth, location-based cafe discovery from Supabase on the home screen, maps.

Still on mock data (next up): search results, order persistence (currently AsyncStorage), favorites, cafe detail, and the admin dashboard. After that: Stripe payments, a live order queue via Supabase Realtime, push notifications, and reviews.
