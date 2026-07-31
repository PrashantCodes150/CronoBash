// @ts-nocheck
// supabase/functions/leave_room/index.ts
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
    const { userId, roomId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      throw new Error("Room not found");
    }

    // Remove user from room members
    const { error: deleteError } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    // Handle early leaver forfeiture for Money Lobbies
    if (room.type === "money" && room.entry_fee > 0) {
      // In money rooms, if you leave early, your entry fee is split among remaining members
      const { data: remainingMembers, error: membersError } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (!membersError && remainingMembers && remainingMembers.length > 0) {
        const shareAmount = Math.floor(room.entry_fee / remainingMembers.length);
        
        for (const member of remainingMembers) {
          // Fetch wallet
          const { data: wallet } = await supabase
            .from("wallets")
            .select("id, balance")
            .eq("user_id", member.user_id)
            .single();

          if (wallet) {
            await supabase
              .from("wallets")
              .update({ balance: wallet.balance + shareAmount })
              .eq("id", wallet.id);

            // Record transaction
            await supabase
              .from("transactions")
              .insert({
                user_id: member.user_id,
                type: "winning",
                amount: shareAmount,
                description: `Distribution share from early leaver in room ${room.name}`
              });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
