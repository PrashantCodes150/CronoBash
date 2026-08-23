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

    const { referrerCode, refereeUserId } = await req.json()
    const targetUserId = callerUserId || refereeUserId
    if (!referrerCode || !targetUserId) {
      throw new Error("Missing referrerCode or refereeUserId")
    }

    if (callerUserId && refereeUserId && callerUserId !== refereeUserId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You cannot redeem referrals on behalf of another user." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      )
    }

    // 1. Prevent duplicate referral claims
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', targetUserId)
      .maybeSingle()

    if (existingRef) {
      return new Response(
        JSON.stringify({ error: "A referral bonus has already been redeemed for this account." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 2. Resolve referrer user ID from invite code
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id')

    if (userErr) throw userErr

    const referrer = (users || []).find((u: any) => u.id.substring(0, 8).toUpperCase() === referrerCode.toUpperCase())
    if (!referrer) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    if (referrer.id === targetUserId) {
      return new Response(
        JSON.stringify({ error: "You cannot refer yourself." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 3. Insert into referrals log table
    const { error: refErr } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: targetUserId,
        coins_awarded: 20
      })

    if (refErr) throw refErr

    // 3. Credit Referrer (+20 coins) and Referee (+10 coins)
    await supabase.rpc('deposit_tokens_secure', {
      p_user_id: referrer.id,
      p_amount: 20
    })

    await supabase.rpc('deposit_tokens_secure', {
      p_user_id: refereeUserId,
      p_amount: 10
    })

    return new Response(
      JSON.stringify({ success: true, referrerId: referrer.id }),
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
