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

    const { roomId, adminUserId } = await req.json()
    if (!roomId || !adminUserId) {
      throw new Error("Missing roomId or adminUserId")
    }

    // 1. Audit user role to verify admin privileges
    const { data: profile, error: roleErr } = await supabase
      .from('users')
      .select('is_pro')
      .eq('id', adminUserId)
      .single()

    if (roleErr || !profile || !profile.is_pro) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Administrative role required." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    // 2. Set the room inactive
    const { error: roomErr } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId)

    if (roomErr) throw roomErr

    // 3. Emit a broadcast event to notify connected clients to leave
    const channel = supabase.channel(`room_${roomId}_signaling`)
    await channel.send({
      type: 'broadcast',
      event: 'session_end_event',
      payload: { endedBy: adminUserId, reason: 'admin_force_reset' }
    })

    return new Response(
      JSON.stringify({ success: true, message: `Room ${roomId} has been force-closed.` }),
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
