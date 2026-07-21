// supabase/functions/settle_money/index.ts
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
    const { roomId, winnerId, totalPrize, platformFee } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const netWinnings = totalPrize - platformFee;

    // Fetch winner's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", winnerId)
      .single();

    if (walletError || !wallet) {
      throw new Error("Winner's wallet not found");
    }

    // Increment balance
    const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: wallet.balance + netWinnings })
      .eq("id", wallet.id);

    if (updateError) {
      throw updateError;
    }

    // Record winnings transaction
    await supabase
      .from("transactions")
      .insert({
        user_id: winnerId,
        type: "winning",
        amount: netWinnings,
        description: `Winnings payout for lobby room ${roomId} (net of 10% platform fee)`
      });

    // Record platform fee transaction
    await supabase
      .from("transactions")
      .insert({
        user_id: winnerId, // linked to the transaction reference
        type: "platform_fee",
        amount: platformFee,
        description: `Platform fee collected for lobby room ${roomId}`
      });

    return new Response(JSON.stringify({ success: true, netWinnings }), {
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
