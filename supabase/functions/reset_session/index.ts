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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authentication credentials." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const { data: { user: callerUser }, error: authErr } = await supabase.auth.getUser(token)

    if (authErr || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid session token." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      )
    }

    const { roomId } = await req.json()
    if (!roomId) {
      throw new Error("Missing roomId parameter")
    }

    // 1. Audit user role to verify true admin privileges
    const { data: profile, error: roleErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    const isAuthorizedAdmin = 
      callerUser.user_metadata?.role === 'admin' ||
      profile?.role === 'admin' ||
      callerUser.email === 'admin@cronobash.com'

    if (!isAuthorizedAdmin) {
      return new Response(
        JSON.stringify({ error: "Access Denied: True administrative privileges required." }),
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
