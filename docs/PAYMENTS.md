# BREAK — Setting Up Card Payments (Stripe)

The app is wired for card payments through Stripe, but payments stay **off**
until you add two keys. Until then, checkout works exactly like it always has:
tapping "Pay" places the order directly, with no payment step. Nothing is
broken — the payment code simply waits for keys.

## How it works (30-second version)

When the keys are in place, tapping "Pay" does three things:

1. The app asks a small server function ("create-payment-intent", running on
   Supabase) to price the order. The server looks up the real menu prices in
   the database — the phone never gets to say what things cost — and tells
   Stripe to expect a payment for that amount.
2. Stripe's payment sheet slides up and the customer enters their card.
3. Only after the card is charged does the app actually place the order.
   If the customer closes the sheet, nothing is ordered and nothing is charged.

There are two keys because Stripe splits them by job:

- **Publishable key** (starts with `pk_`) — identifies your Stripe account to
  the app. Safe to embed in the app itself.
- **Secret key** (starts with `sk_`) — can move money, so it lives only on the
  server (Supabase), never in the app.

## Setup steps

### 1. Create a Stripe account

Go to [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
and sign up. You do not need to "activate" the account (the part where they ask
for bank details) to test — test mode works immediately.

### 2. Copy your TEST keys

In the Stripe Dashboard, make sure the **Test mode** toggle (top right) is ON,
then go to **Developers → API keys**. You'll see:

- Publishable key — `pk_test_...`
- Secret key — `sk_test_...` (click "Reveal" to see it)

### 3. Put the publishable key in the app's .env

Open `.env` in the project root (`break_cafe/`) and add:

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_paste-yours-here
```

### 4. Put the secret key into Supabase

The server function needs the secret key:

1. Open your Supabase project dashboard.
2. Go to **Edge Functions → create-payment-intent → Secrets**.
3. Add a secret named `STRIPE_SECRET_KEY` with your `sk_test_...` value.

(If the function isn't listed yet, it needs to be deployed first —
its code lives at `supabase/functions/create-payment-intent/index.ts`.)

### 5. Rebuild the app

The Stripe SDK includes native code, so a plain JS reload isn't enough —
rebuild once:

```
npx expo run:ios
```

### 6. Test it

Add something to the cart, go to checkout, tap Pay. Stripe's card sheet should
appear. Use Stripe's standard test card:

- Card number: `4242 4242 4242 4242`
- Expiry: any future date · CVC: any 3 digits · ZIP: any 5 digits

The payment will show up under **Payments** in the Stripe Dashboard (test
mode), and the order will appear in the app as usual.

## Going live (later)

When you're ready for real cards: activate the Stripe account (bank details),
flip the dashboard out of test mode, and repeat steps 2–5 with the **live**
keys (`pk_live_...` / `sk_live_...`).

## Troubleshooting

- **Checkout skips straight to the order, no card sheet** — the publishable
  key isn't set (or the app wasn't restarted/rebuilt after adding it).
- **"We couldn't start your payment"** — usually the server side: the
  `STRIPE_SECRET_KEY` secret is missing in Supabase, or the edge function
  isn't deployed. Check the function's logs in the Supabase dashboard.
- **App crashes on launch after adding the key** — the app binary predates the
  Stripe SDK; run `npx expo run:ios` to rebuild.
