# CogniSweep Database Setup Guide

## Prerequisites

- Supabase project (free tier works)
- Supabase CLI installed globally (`npm i -g supabase`)
- Node.js 18+

## Step 1: Initialize Supabase (if not already done)

```bash
supabase init
```

## Step 2: Run the Schema

### Fresh setup

Go to your Supabase Dashboard → SQL Editor and paste the contents of `schema.sql`, then click "Run".

### Re-running after changes (reset everything)

First run `supabase/teardown.sql` to drop all objects, then run `schema.sql`.

```bash
# Or using the CLI:
supabase db push
```

## Step 3: Set Up Environment Variables

The `.env.local` file is already in the project root. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in: Supabase Dashboard → Settings → API.

## Step 4: Enable Realtime

In Supabase Dashboard → Database → Replication:

1. Enable replication for the `room_members` table (for live leaderboards)
2. Enable replication for the `wallets` table (for balance updates)
3. Enable replication for the `messages` table (for live chat)

## Step 5: Deploy Edge Functions

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the settlement function
supabase functions deploy settle-money-rooms

# Deploy the daily reset function
supabase functions deploy reset-daily-focus
```

## Step 6: Set Up Scheduled Settlement

### Option A: pg_cron (Recommended)

In SQL Editor, run:

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule settlement at midnight UTC daily
select cron.schedule(
  'settle-money-rooms',
  '0 0 * * *',
  $$ select public.settle_money_rooms(); $$
);

-- Verify the job
select * from cron.job where jobname = 'settle-money-rooms';
```

### Option B: External Cron (GitHub Actions)

Create `.github/workflows/settle.yml`:

```yaml
name: Daily Settlement
on:
  schedule:
    - cron: '0 0 * * *'  # Midnight UTC
  workflow_dispatch:

jobs:
  settle:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Settlement
        run: |
          curl -X POST \
            https://YOUR_PROJECT.supabase.co/functions/v1/settle-money-rooms \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

Add `CRON_SECRET` to your Supabase Edge Function secrets:

```bash
supabase secrets set CRON_SECRET=your-secret-here
```

## Step 7: Enable Auth Providers

In Supabase Dashboard → Authentication → Providers:

1. Enable Email/Password
2. Optionally enable Google, GitHub, etc.

## Step 8: Test the Setup

1. Sign up a new user (triggers profile + wallet creation with 1000 welcome tokens)
2. Create a room
3. Join the room
4. Start a study session
5. End the session and verify focus seconds update
6. Check wallet balance for entry fee deduction (money rooms)

## File Structure

```
cognisweep/
├── schema.sql                          # Main database schema + functions
├── .env.local                          # Supabase credentials (gitignored)
├── supabase/
│   ├── config.toml                     # Supabase project config
│   ├── teardown.sql                    # Drop everything for clean re-run
│   ├── import_map.json                 # Edge Function import map
│   ├── sample-queries.sql              # Example queries for reference
│   └── functions/
│       ├── settle-money-rooms/
│       │   └── index.ts                # End-of-day settlement
│       └── reset-daily-focus/
│           └── index.ts                # Daily focus counter reset
└── src/
    └── lib/
        └── supabase.ts                 # Client + TypeScript types
```

## Database Functions Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `settle_money_rooms()` | End-of-day money room settlement (winner calc, wallet updates, focus reset) | `json` with results |
| `reset_daily_focus()` | Reset all daily focus counters | `json` with count |
| `get_room_leaderboard(room_id)` | Room leaderboard with rankings | `table` of entries |
| `get_user_today_focus(user_id)` | Total focus seconds today | `integer` |
| `get_user_weekly_stats(user_id)` | 7-day focus + tasks stats | `table` |
| `get_room_stats(room_id)` | Room overview stats | `json` |
| `join_money_room(user_id, room_id)` | Join room + deduct fee atomically | `json` result |
| `get_user_dashboard(user_id)` | Single-query dashboard summary | `json` |

## Edge Function Settlement Flow

The `settle_money-rooms` Edge Function triggers the `settle_money_rooms()` SQL function which:

1. Iterates all active money rooms with `is_active = true`
2. Skips rooms with fewer than 2 members
3. Finds the winner: `ORDER BY total_focus_seconds_today DESC, joined_at ASC LIMIT 1`
4. Computes: `total_pool = entry_fee × member_count`
5. Computes: `platform_fee = total_pool × platform_fee_percent / 100`
6. Computes: `winner_share = total_pool - platform_fee`
7. Credits winner's wallet with `winner_share`, inserts `winning` transaction
8. Credits room owner's wallet with `platform_fee`, inserts `platform_fee` transaction
9. Resets `room_members.total_focus_seconds_today = 0` for all money room members

### Testing settlement manually

```bash
# Via Supabase CLI
supabase functions invoke settle-money-rooms --header "Authorization: Bearer YOUR_CRON_SECRET"

# Via curl
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/settle-money-rooms \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Performance Indexes

The schema includes these indexes for query optimization:

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_study_sessions_user_start` | `study_sessions` | `(user_id, start_time DESC)` | Analytics date-range queries |
| `idx_study_sessions_start_cover` | `study_sessions` | `start_time INCLUDE (user_id, focus_seconds, total_seconds)` | Covering index for aggregation |
| `idx_transactions_user_created` | `transactions` | `(user_id, created_at DESC)` | Wallet history & charts |
| `idx_tasks_user_completed` | `tasks` | `(user_id, completed) WHERE completed = true` | Subject distribution |
| `idx_room_members_leaderboard` | `room_members` | `(room_id, total_focus_seconds_today DESC)` | Leaderboard ordering |

## Real-Time Subscriptions (TypeScript)

```typescript
// Subscribe to leaderboard changes
const channel = supabase
  .channel('room-leaderboard')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'room_members',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    // Update leaderboard UI
    console.log(payload.new);
  })
  .subscribe();

// Subscribe to wallet balance changes
const channel = supabase
  .channel('wallet')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'wallets',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update balance display
    console.log(payload.new.balance);
  })
  .subscribe();
```

## Troubleshooting

- **"relation does not exist"**: Run `supabase/teardown.sql` first, then `schema.sql`
- **RLS blocking queries**: Check policies, ensure user is authenticated
- **Edge Functions 401**: Verify `CRON_SECRET` is set in both the function secrets and your cron caller
- **Realtime not working**: Enable replication for the specific tables in Database → Replication
- **Supabase CLI errors**: Ensure `config.toml` and `import_map.json` are valid (run `supabase start` to test)
