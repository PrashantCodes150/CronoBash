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

    const { userId } = await req.json()
    if (!userId) {
      throw new Error("Missing userId")
    }

    // 1. Fetch user base profile
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', userId)
      .single()

    if (userErr || !user) throw userErr || new Error("User profile not found")

    // 2. Aggregate total focus sessions stats
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('winner_id, duration_minutes, focus_seconds, distraction_count, reward_details')
      .or(`winner_id.eq.${userId},winner_id.is.null`) // Check participant logs

    let totalFocusSeconds = 0
    let totalDistractions = 0
    let sessionsCount = 0
    let winCount = 0

    if (!sessErr && sessions) {
      sessionsCount = sessions.length
      sessions.forEach((s: any) => {
        totalFocusSeconds += s.focus_seconds || 0
        totalDistractions += s.distraction_count || 0
        if (s.winner_id === userId) {
          winCount++
        }
      })
    }

    // 3. Count total cheat frames
    const { count: staticCheatCount } = await supabase
      .from('distraction_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'static-frame')

    // Verified badge if static-frame reports represent < 5% of total sessions
    const cheatRatio = sessionsCount > 0 ? (staticCheatCount || 0) / sessionsCount : 0
    const verifiedBadge = cheatRatio < 0.05

    const totalHours = Number((totalFocusSeconds / 3600).toFixed(2))
    const winRate = sessionsCount > 0 ? Number(((winCount / sessionsCount) * 100).toFixed(2)) : 0.00
    
    // Average focus % over total elapsed minutes
    const totalMinutes = totalFocusSeconds / 60
    const avgFocus = totalMinutes > 0 ? Math.min(100, Math.floor((totalFocusSeconds / (totalMinutes * 60)) * 100)) : 100

    // 4. Update leaderboard cache table
    const { error: upsertErr } = await supabase
      .from('leaderboard_cache')
      .upsert({
        user_id: userId,
        name: user.name,
        avatar_url: user.avatar_url,
        total_focus_hours: totalHours,
        avg_focus_percent: avgFocus,
        win_rate: winRate,
        verified_badge: verifiedBadge,
        updated_at: new Date().toISOString()
      })

    if (upsertErr) throw upsertErr

    return new Response(
      JSON.stringify({ success: true, totalHours, winRate, verifiedBadge }),
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
