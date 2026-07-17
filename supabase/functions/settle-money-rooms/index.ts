// supabase/functions/settle-money-rooms/index.ts
// End-of-day money room settlement Edge Function
// Deploy: supabase functions deploy settle-money-rooms
// Schedule via pg_cron or external cron (e.g. GitHub Actions)
//
// This function calls the settle_money_rooms() SQL RPC which:
//   1. Finds all active money rooms with >= 2 members
//   2. Picks the winner (most focus_seconds_today, ties broken by earliest joined_at)
//   3. Computes total_pool = entry_fee * member_count
//   4. Computes platform_fee = total_pool * platform_fee_percent / 100
//   5. Credits winner's wallet with (total_pool - platform_fee)
//   6. Credits room owner's wallet with platform_fee
//   7. Inserts transaction records for both
//   8. Resets all room_members.total_focus_seconds_today = 0
//
// Environment variables required:
//   CRON_SECRET              - shared secret for cron auth
//   SUPABASE_URL             - auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - auto-set by Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();
    const { data, error } = await supabase.rpc("settle_money_rooms");
    const elapsedMs = Date.now() - startTime;

    if (error) {
      console.error(`Settlement error (${elapsedMs}ms):`, error);
      return new Response(
        JSON.stringify({ error: error.message, elapsed_ms: elapsedMs }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = data as { settled_at: string; rooms: any[] };
    const settled = result?.rooms?.filter((r: any) => r.status === "settled") || [];
    const skipped = result?.rooms?.filter((r: any) => r.status === "skipped") || [];
    const noActivity = result?.rooms?.filter((r: any) => r.status === "no_activity") || [];

    console.log(
      `Settlement completed in ${elapsedMs}ms: ${settled.length} settled, ${skipped.length} skipped, ${noActivity.length} no activity`
    );

    return new Response(
      JSON.stringify({
        success: true,
        elapsed_ms: elapsedMs,
        summary: {
          settled: settled.length,
          skipped: skipped.length,
          no_activity: noActivity.length,
        },
        settled_rooms: settled.map((r: any) => ({
          room: r.room_name,
          winner: r.winner_name,
          pool: r.total_pool,
          winner_share: r.winner_share,
          platform_fee: r.platform_fee,
        })),
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
