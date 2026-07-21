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

    const { userId } = await req.json()
    if (!userId) {
      throw new Error("Missing userId")
    }

    // 1. Fetch study sessions of the user from past 30 days
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('winner_id', userId) // Check active participations
      .order('created_at', { ascending: false })

    let streakDays = 0
    if (!error && sessions && sessions.length > 0) {
      const dates = sessions.map(s => s.created_at.split('T')[0])
      const uniqueDates = [...new Set(dates)]
      
      let current = new Date()
      streakDays = 0

      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDateStr = current.toISOString().split('T')[0]
        if (uniqueDates.includes(checkDateStr)) {
          streakDays++
          current.setDate(current.getDate() - 1)
        } else if (i === 0) {
          // If not today, check if they studied yesterday
          current.setDate(current.getDate() - 1)
          const yesterdayStr = current.toISOString().split('T')[0]
          if (uniqueDates.includes(yesterdayStr)) {
            streakDays++
            current.setDate(current.getDate() - 1)
          } else {
            break
          }
        } else {
          break
        }
      }
    }

    // 2. Update streaks table
    const { data: existingStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    const maxStreak = Math.max(existingStreak?.max_streak_days || 0, streakDays)

    const { error: upsertErr } = await supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        current_streak_days: streakDays,
        max_streak_days: maxStreak,
        last_study_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })

    if (upsertErr) throw upsertErr

    // 3. Award streak bonuses (3-day: 10 coins, 7-day: 50 coins)
    let bonus = 0
    if (streakDays === 3) bonus = 10
    else if (streakDays === 7) bonus = 50

    if (bonus > 0) {
      await supabase.rpc('deposit_tokens_secure', {
        p_user_id: userId,
        p_amount: bonus
      })
    }

    return new Response(
      JSON.stringify({ success: true, streakDays, maxStreak, bonusAwarded: bonus }),
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
