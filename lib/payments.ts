import { supabase } from './supabase';

// Stripe goes live only when a publishable key is present in .env. Without
// one the app keeps today's behavior — checkout places orders directly with
// no payment step — so nothing breaks before a Stripe account exists.
// Setup guide: docs/PAYMENTS.md.
export const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const stripeEnabled = Boolean(stripePublishableKey);

// IMPORTANT: never import '@stripe/stripe-react-native' at the top of a file.
// Its JS module touches the Stripe native module at import time (it builds a
// NativeEventEmitter), which crashes app binaries built before the SDK was
// added. Both call sites (here and app/_layout.tsx) require() it lazily, and
// only run that code path when stripeEnabled is true — i.e. after a key was
// added and the app rebuilt.
function stripeModule() {
  return require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
}

export interface PaymentLineItem {
  menu_item_id: number;
  quantity: number;
}

/**
 * Asks the create-payment-intent edge function to price the order and create
 * a Stripe PaymentIntent. Only item ids, quantities, and the tip percent are
 * sent — the server reprices everything from the database, so a tampered
 * client can't change what it pays.
 */
export async function createPaymentIntent(args: {
  cafeId: number;
  items: PaymentLineItem[];
  tipPercent: number;
}): Promise<{ clientSecret: string; amount: number }> {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      cafe_id: args.cafeId,
      items: args.items,
      tip_percent: args.tipPercent,
    },
  });
  if (error) throw new Error(`create-payment-intent failed: ${error.message}`);
  if (!data?.client_secret) throw new Error('create-payment-intent returned no client secret');
  return { clientSecret: data.client_secret as string, amount: data.amount as number };
}

export type PaymentSheetOutcome = 'paid' | 'canceled' | 'failed';

/**
 * Runs Stripe's prebuilt payment sheet for the given PaymentIntent and
 * reports how it ended. 'canceled' means the user closed the sheet on
 * purpose — callers should stop quietly, not show an error.
 */
export async function presentStripePaymentSheet(
  clientSecret: string
): Promise<PaymentSheetOutcome> {
  const stripe = stripeModule();

  const { error: initError } = await stripe.initPaymentSheet({
    merchantDisplayName: 'BREAK',
    paymentIntentClientSecret: clientSecret,
  });
  if (initError) {
    console.error('initPaymentSheet failed:', initError);
    return 'failed';
  }

  const { error: presentError } = await stripe.presentPaymentSheet();
  if (presentError) {
    if (presentError.code === stripe.PaymentSheetError.Canceled) return 'canceled';
    console.error('presentPaymentSheet failed:', presentError);
    return 'failed';
  }
  return 'paid';
}
