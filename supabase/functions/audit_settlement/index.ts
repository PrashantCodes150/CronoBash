// @ts-nocheck
// supabase/functions/audit_settlement/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const isAuthorized =
      authHeader &&
      ((cronSecret && authHeader.includes(cronSecret)) ||
       (serviceRoleKey && authHeader.includes(serviceRoleKey)));

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Restricted administrative settlement service." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { roomId, winnerId, totalPool, feeCollected, payoutDetails } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const auditId = crypto.randomUUID();

    // Log the transaction settlement details inside public.transactions or audit files
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: winnerId,
        type: "winning",
        amount: totalPool - feeCollected,
        description: `Audit Settlement ID: ${auditId} | Winner payout. Net pool: ₹${totalPool - feeCollected}. Fee: ₹${feeCollected}`
      });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        auditId,
        settledAt: new Date().toISOString(),
        message: "Lobby settlement successfully audited and saved."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
