// send-order-push — Supabase Edge Function (Deno)
//
// Receives a database-webhook payload for public.orders UPDATEs and sends the
// customer an Expo push notification when the order status changes.
//
// Expected payload (what supabase/push_trigger.sql posts):
//   { "type": "UPDATE", "record": <new orders row>, "old_record": <old orders row> }
//
// Auth: the caller must send header `x-webhook-secret` matching the
// ORDER_PUSH_WEBHOOK_SECRET function secret. Everything else is rejected.
//
// Every "nothing to do" case (no status change, uninteresting status, user has
// no push token) returns 200 so the webhook never retries pointlessly.

import { createClient } from 'npm:@supabase/supabase-js@2'

type OrderRow = {
  order_id: number
  user_id: string
  cafe_id: number
  status: string
}

type WebhookPayload = {
  type: string
  record: OrderRow
  old_record: OrderRow
}

// Friendly copy per status, in the BREAK voice.
const MESSAGES: Record<string, { title: string; body: string }> = {
  accepted: {
    title: 'Order accepted',
    body: "The cafe has your order and is on it. We'll ping you when it's ready.",
  },
  preparing: {
    title: 'Your order is being made',
    body: 'Hands are on your order right now. Almost break time.',
  },
  ready: {
    title: 'Your order is ready',
    body: "Your order is ready — come grab it while it's hot.",
  },
  completed: {
    title: 'Order picked up',
    body: 'Enjoy your break. See you next time.',
  },
  cancelled: {
    title: 'Order cancelled',
    body: 'Your order was cancelled. If that seems wrong, check with the cafe.',
  },
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Shared-secret gate: only our database webhook may call this.
  const secret = Deno.env.get('ORDER_PUSH_WEBHOOK_SECRET')
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401)
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  const { type, record, old_record } = payload
  if (type !== 'UPDATE' || !record || !old_record) {
    return json({ skipped: 'not an orders UPDATE payload' })
  }

  // Only act on a real status transition into a notifiable state.
  if (record.status === old_record.status) {
    return json({ skipped: 'status unchanged' })
  }
  const message = MESSAGES[record.status]
  if (!message) {
    return json({ skipped: `no notification for status "${record.status}"` })
  }

  // Service-role client: bypasses RLS to read the customer's push token.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', record.user_id)
    .maybeSingle()
  if (error) {
    return json({ error: `profile lookup failed: ${error.message}` }, 500)
  }

  // User never registered a device — fine, just do nothing.
  if (!profile?.expo_push_token) {
    return json({ skipped: 'user has no push token' })
  }

  const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: profile.expo_push_token,
      title: message.title,
      body: message.body,
      sound: 'default',
      data: { order_id: record.order_id, status: record.status },
    }),
  })
  const pushBody = await pushRes.json().catch(() => null)
  if (!pushRes.ok) {
    return json({ error: 'Expo push API error', detail: pushBody }, 502)
  }

  return json({ sent: true, status: record.status, ticket: pushBody })
})
