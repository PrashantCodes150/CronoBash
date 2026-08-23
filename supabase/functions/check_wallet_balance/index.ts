// @ts-nocheck
// supabase/functions/check_wallet_balance/index.ts
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authentication credentials." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user: callerUser }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session token." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { userId, entryFee } = await req.json();

    if (callerUser.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Cannot perform wallet operations for another user." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Fetch user wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (wallet.balance < entryFee) {
      return new Response(JSON.stringify({ allowed: false, error: "Insufficient balance" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct and Lock Funds in Escrow
    const newBalance = wallet.balance - entryFee;
    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    if (updateError) {
      throw updateError;
    }

    // Record Escrow transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "entry_fee",
        amount: -entryFee,
        description: `Escrow locked for study room entry fee.`
      });

    if (txError) {
      throw txError;
    }

    return new Response(JSON.stringify({ allowed: true, newBalance }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
