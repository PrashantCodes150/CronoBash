// @ts-nocheck
// supabase/functions/end_session/index.ts
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

    const { roomId, winnerId, durationMinutes, participantsCount, focusSeconds, distractionCount } = await req.json();
    if (!roomId) {
      throw new Error("Missing roomId parameter");
    }

    // Verify caller is a member or host of the target room
    const { data: membership, error: memErr } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", callerUser.id)
      .maybeSingle();

    const { data: roomData } = await supabase
      .from("rooms")
      .select("owner_id")
      .eq("id", roomId)
      .maybeSingle();

    const isHostOrMember = membership || roomData?.owner_id === callerUser.id;
    if (!isHostOrMember) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Caller is not a participant in this room session." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Call the PL/pgSQL secure transaction RPC
    const { data, error } = await supabase.rpc("process_room_settlement", {
      p_room_id: roomId,
      p_winner_id: winnerId,
      p_duration_minutes: durationMinutes || 25,
      p_participants: participantsCount || 1,
      p_focus_seconds: focusSeconds || 0,
      p_distraction_count: distractionCount || 0
    });

    if (error) {
      console.error("Settlement transaction failed:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, result: data }), {
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
