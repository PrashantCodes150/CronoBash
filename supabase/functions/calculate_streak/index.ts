// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    )

    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization')
    let callerUserId: string | null = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim()
      const { data: { user } } = await supabase.auth.getUser(token)
      callerUserId = user?.id ?? null
    }

    const { userId } = await req.json()
    const targetUserId = callerUserId || userId
    if (!targetUserId) {
      throw new Error("Missing userId parameter")
    }

    if (callerUserId && userId && callerUserId !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You cannot calculate streaks on behalf of another user." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      )
    }

    // 1. Fetch study sessions of the user from past 30 days
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('winner_id', targetUserId) // Check active participations
      .order('created_at', { ascending: false })

    let streakDays = 0
    if (!error && sessions && sessions.length > 0) {
      const dates = sessions.map((s: any) => s.created_at.split('T')[0])
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
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: existingStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle()

    const alreadyAwardedToday = existingStreak?.last_study_date === todayStr
    const maxStreak = Math.max(existingStreak?.max_streak_days || 0, streakDays)

    const { error: upsertErr } = await supabase
      .from('streaks')
      .upsert({
        user_id: targetUserId,
        current_streak_days: streakDays,
        max_streak_days: maxStreak,
        last_study_date: todayStr,
        updated_at: new Date().toISOString()
      })

    if (upsertErr) throw upsertErr

    // 3. Award streak bonuses (3-day: 10 coins, 7-day: 50 coins) - only if not already awarded today
    let bonus = 0
    if (!alreadyAwardedToday) {
      if (streakDays === 3) bonus = 10
      else if (streakDays === 7) bonus = 50

      if (bonus > 0) {
        await supabase.rpc('deposit_tokens_secure', {
          p_user_id: targetUserId,
          p_amount: bonus
        })
      }
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
