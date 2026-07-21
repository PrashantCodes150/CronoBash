import { supabase } from './supabaseClient';

export async function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('analytics_logs')
      .insert({
        user_id: user?.id || null,
        event_name: eventName,
        properties: properties
      });

    if (error) throw error;
  } catch (err) {
    console.warn("Analytics event log failed to save:", err);
  }
}
