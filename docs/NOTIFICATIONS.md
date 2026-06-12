# Push notifications — what's built and how to turn it on

Customers get a push on their phone when a cafe changes their order's status
(accepted, preparing, ready, completed, cancelled).

## What's already in the code

- `lib/notifications.ts` — asks for notification permission after sign-in and
  saves the phone's push token to the user's profile. It quietly does nothing
  on simulators, on web, if permission is denied, or until step 1 below is done.
- `app/_layout.tsx` — kicks off that registration once you're signed in.
- `supabase/functions/send-order-push/index.ts` — a server function that sends
  the actual push when an order's status changes.
- `supabase/push_trigger.sql` — the database hook that calls that function.
  **Not applied yet** — nothing fires until you run it (part 2 below).

## Part 1 — get pushes working on your phone

1. **Link the app to an Expo project.** From the project folder, run:

   ```
   npx eas init
   ```

   You're already logged in as Expo user `nicktan`, so just accept the
   prompts. This writes a `projectId` into `app.json` — that id is what the
   warning `no EAS projectId in app config` is asking for.

2. **Rebuild the app on a real iPhone** (push doesn't work in the simulator):

   ```
   npx expo run:ios --device
   ```

3. **Sign in on the phone and allow notifications** when it asks. That's it —
   your push token is now saved on your profile automatically.

   To sanity-check: in the Supabase dashboard, look at the `profiles` table —
   your row should now have a value in `expo_push_token`.

## Part 2 — turn on the order-status pushes

Do this once the admin order queue is updating real orders. The
`send-order-push` function must be deployed first (handled separately — check
the dashboard's Edge Functions page shows it).

1. **Pick a secret.** Any long random string, e.g. run
   `openssl rand -hex 32` in Terminal and copy the output. This is just a
   password so only your database can trigger pushes.

2. **Give the secret to the function.** Supabase dashboard → Edge Functions →
   `send-order-push` → Secrets → add `ORDER_PUSH_WEBHOOK_SECRET` with that
   value. (Or: `npx supabase secrets set ORDER_PUSH_WEBHOOK_SECRET=<value>`.)

3. **Wire up the database.** Open `supabase/push_trigger.sql`, replace
   `<SET-ME>` with the same secret, then paste the whole file into the
   dashboard's SQL Editor and run it.

4. **Test it.** Place an order from your phone, then in the admin queue (or
   the dashboard's `orders` table) change its status to `ready`. Your phone
   should buzz: "Your order is ready — come grab it while it's hot."

## If pushes don't arrive

- Phone settings → Notifications → BREAK → make sure notifications are allowed.
- `profiles.expo_push_token` empty? Sign out and back in on the phone after
  Part 1 — registration runs at sign-in.
- Status changes but no push? Dashboard → Edge Functions → `send-order-push`
  → Logs. "unauthorized" there means the secret in `push_trigger.sql` doesn't
  match the function secret.
