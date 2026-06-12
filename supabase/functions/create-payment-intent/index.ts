// ============================================================
// create-payment-intent — Supabase Edge Function (Deno)
//
// Prices an order ENTIRELY on the server and creates a Stripe
// PaymentIntent for it. The client sends only menu item ids,
// quantities, and a tip percent — never prices — so a tampered
// client cannot change what it pays.
//
// Request (POST, authenticated):
//   { cafe_id: number,
//     items: [{ menu_item_id: number, quantity: number }, ...],
//     tip_percent: 0 | 10 | 15 | 20 }
// Response 200: { client_secret: string, amount: number }  (amount in cents)
//
// Secrets (Dashboard → Edge Functions → create-payment-intent → Secrets):
//   STRIPE_SECRET_KEY — required; the function refuses to run without it.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
// injected automatically by the Supabase platform.
// ============================================================

import Stripe from 'npm:stripe@^17';
import { createClient } from 'npm:@supabase/supabase-js@^2';

// Must match TIP_OPTIONS in app/checkout.tsx.
const ALLOWED_TIP_PERCENTS = [0, 10, 15, 20];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return json(503, {
        error:
          'Stripe is not configured: the STRIPE_SECRET_KEY secret is unset. ' +
          'Add it under Supabase Dashboard → Edge Functions → create-payment-intent → Secrets.',
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    // --- Authenticate the caller from their JWT; reject anonymous calls ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json(401, { error: 'Missing Authorization header.' });
    }
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return json(401, { error: 'You must be signed in to pay.' });
    }

    // --- Validate input shape (ids + quantities only, never prices) ---
    const { cafe_id, items, tip_percent } = await req.json();

    if (!Number.isInteger(cafe_id)) {
      return json(400, { error: 'cafe_id must be an integer.' });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return json(400, { error: 'items must be a non-empty array (max 50 lines).' });
    }
    for (const item of items) {
      if (
        !item ||
        !Number.isInteger(item.menu_item_id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      ) {
        return json(400, {
          error: 'Each item needs an integer menu_item_id and a quantity between 1 and 99.',
        });
      }
    }
    if (!ALLOWED_TIP_PERCENTS.includes(tip_percent)) {
      return json(400, { error: 'tip_percent must be one of 0, 10, 15, or 20.' });
    }

    // --- Price the order from the database (service role client) ---
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const ids = items.map((item: { menu_item_id: number }) => item.menu_item_id);
    const { data: menuRows, error: menuError } = await serviceClient
      .from('menu_items')
      .select('menu_item_id, price')
      .eq('cafe_id', cafe_id)
      .in('menu_item_id', ids);
    if (menuError) {
      console.error('menu_items lookup failed:', menuError);
      return json(500, { error: 'Could not load menu prices.' });
    }

    // Work in integer cents end to end to avoid float drift.
    const priceCentsById = new Map<number, number>(
      (menuRows ?? []).map((row: { menu_item_id: number; price: number }) => [
        row.menu_item_id,
        Math.round(Number(row.price) * 100),
      ])
    );

    let subtotalCents = 0;
    for (const item of items) {
      const unitCents = priceCentsById.get(item.menu_item_id);
      if (unitCents === undefined) {
        return json(400, {
          error: `Menu item ${item.menu_item_id} was not found at this cafe.`,
        });
      }
      subtotalCents += unitCents * item.quantity;
    }
    const tipCents = Math.round((subtotalCents * tip_percent) / 100);
    const amount = subtotalCents + tipCents;

    if (amount < 50) {
      // Stripe's minimum charge is $0.50 USD.
      return json(400, { error: 'Order total is below the card-payment minimum.' });
    }

    // --- Create the PaymentIntent ---
    const stripe = new Stripe(stripeSecretKey, {
      // Deno's edge runtime has no Node http stack; use fetch.
      httpClient: Stripe.createFetchHttpClient(),
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        app: 'break-cafe',
        cafe_id: String(cafe_id),
        user_id: user.id,
        tip_percent: String(tip_percent),
      },
    });

    return json(200, { client_secret: paymentIntent.client_secret, amount });
  } catch (error) {
    console.error('create-payment-intent error:', error);
    return json(500, { error: 'Unexpected error while creating the payment.' });
  }
});
