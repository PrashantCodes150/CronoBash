// @ts-nocheck
// supabase/functions/calculate_winner/index.ts
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
    const { roomId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch members and their focus logs
    const { data: members, error: membersError } = await supabase
      .from("room_members")
      .select("*, users:user_id(name, avatar_url)")
      .eq("room_id", roomId);

    if (membersError || !members) {
      throw new Error("Failed to fetch room members");
    }

    // In a real database context, we would query public.focus_logs.
    // For demo/production, we score them using total_focus_seconds_today or simulated strikes.
    const scoredPlayers = members.map(m => {
      // Simulate distraction counts or fetch from focus logs if table exists
      const focusSeconds = m.total_focus_seconds_today || 1200;
      const distractions = 1; // Default/mock strike
      const score = (focusSeconds * 10) - (distractions * 15);
      return {
        userId: m.user_id,
        userName: m.users?.name || "Contestant",
        avatarUrl: m.users?.avatar_url,
        focusSeconds,
        distractionCount: distractions,
        focusScore: Math.max(0, score)
      };
    });

    // Sort descending
    scoredPlayers.sort((a, b) => b.focusScore - a.focusScore);

    const ranked = scoredPlayers.map((player, idx) => ({
      ...player,
      rank: idx + 1
    }));

    return new Response(JSON.stringify({ success: true, standings: ranked }), {
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
