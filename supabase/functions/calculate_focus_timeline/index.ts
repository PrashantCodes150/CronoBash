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

    const { roomId, userId } = await req.json()
    if (!roomId || !userId) {
      throw new Error("Missing roomId or userId")
    }

    // Query focus timeline records for this user session
    const { data: timeline, error } = await supabase
      .from('focus_timeline')
      .select('minute_index, focus_percent')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .order('minute_index', { ascending: true })

    if (error) throw error

    return new Response(
      JSON.stringify({ timeline: timeline || [] }),
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
