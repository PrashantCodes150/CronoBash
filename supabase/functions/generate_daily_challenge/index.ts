import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    )

    const challengeTypes = [
      {
        title: "Focus Sprint Arena",
        description: "Study 50 minutes with active FaceMesh scanner verification.",
        reward_coins: 20,
        badge_name: "Focus Sprint",
        target_minutes: 50
      },
      {
        title: "Absolute Zero Distractions",
        description: "Stay in focus mode for 25 minutes straight with zero posture warnings.",
        reward_coins: 15,
        badge_name: "Distraction-Free",
        target_minutes: 25
      },
      {
        title: "Double Sprints Marathon",
        description: "Study for 60 cumulative minutes inside our public arenas.",
        reward_coins: 30,
        badge_name: "Streak Builder",
        target_minutes: 60
      }
    ]

    // Choose random challenge
    const selected = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]
    
    // Insert new challenge log row for today
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert({
        title: selected.title,
        description: selected.description,
        reward_coins: selected.reward_coins,
        badge_name: selected.badge_name,
        target_minutes: selected.target_minutes,
        date: new Date().toISOString().split('T')[0]
      })
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, challenge: data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
