// @ts-nocheck
// supabase/functions/create_match/index.ts
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

    // Fetch searching matchmaking queries
    const { data: queue, error: queueError } = await supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("status", "searching")
      .order("joined_at", { ascending: true });

    if (queueError) throw queueError;

    const matchesCreated = [];

    // Simple pairing logic: group by skill_level and preferred_duration
    const groups: Record<string, any[]> = {};
    for (const item of queue) {
      const key = `${item.skill_level}_${item.preferred_duration}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    for (const key of Object.keys(groups)) {
      const membersToPair = groups[key];
      while (membersToPair.length >= 2) {
        const p1 = membersToPair.shift()!;
        const p2 = membersToPair.shift()!;

        // Update status in queue
        await supabase
          .from("matchmaking_queue")
          .update({ status: "paired" })
          .in("id", [p1.id, p2.id]);

        // Create Room
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .insert({
            name: `Matchmaking Duel (${p1.skill_level.toUpperCase()})`,
            type: "public",
            max_members: 2,
            subject_tags: ["Matchmaking", p1.skill_level]
          })
          .select()
          .single();

        if (roomError || !room) throw roomError || new Error("Failed to create room");

        // Add to room_members
        await supabase
          .from("room_members")
          .insert([
            { room_id: room.id, user_id: p1.user_id },
            { room_id: room.id, user_id: p2.user_id }
          ]);

        matchesCreated.push({ roomId: room.id, players: [p1.user_id, p2.user_id] });
      }
    }

    return new Response(JSON.stringify({ success: true, matchesCreated }), {
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
