import { createClient } from '@supabase/supabase-js';

/**
 * Server-Only Supabase Administrator Client
 * Uses the privileged SUPABASE_SERVICE_ROLE_KEY.
 * MUST ONLY be imported and executed inside server runtimes (API routes, Server Actions, Edge/Node).
 */

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: getSupabaseAdmin() called in browser client environment.');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
