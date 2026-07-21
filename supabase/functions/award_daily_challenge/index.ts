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

    const { userId, challengeId } = await req.json()
    if (!userId || !challengeId) {
      throw new Error("Missing userId or challengeId")
    }

    // 1. Fetch challenge info
    const { data: challenge, error: challErr } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challErr || !challenge) throw challErr || new Error("Challenge not found")

    // 2. Fetch progress info
    const { data: progress, error: progErr } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (progErr || !progress) throw progErr || new Error("Progress record not found")
    if (progress.claimed_at) {
      return new Response(
        JSON.stringify({ error: "Reward already claimed for this challenge." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 3. Verify target condition
    if (progress.progress < challenge.target_minutes) {
      return new Response(
        JSON.stringify({ error: "Challenge objective not completed yet." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 4. Update balance and set claimed_at
    const { error: walletErr } = await supabase.rpc('deposit_tokens_secure', {
      p_user_id: userId,
      p_amount: challenge.reward_coins
    })

    if (walletErr) throw walletErr

    const { error: claimErr } = await supabase
      .from('user_challenge_progress')
      .update({ claimed_at: new Date().toISOString(), completed: true })
      .eq('id', progress.id)

    if (claimErr) throw claimErr

    return new Response(
      JSON.stringify({ success: true, rewardCoins: challenge.reward_coins }),
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
