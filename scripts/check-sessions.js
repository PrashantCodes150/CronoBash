// scripts/check-sessions.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://antmqynpbnlironmvuab.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudG1xeW5wYm5saXJvbm12dWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNDQzMTEsImV4cCI6MjA5OTgyMDMxMX0.iJsyfojzOjwRQWp9yYSqvxKyayp6gTUAmLe7AH3UAF4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing insert on study_sessions...");
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: 'bad01168-2bc3-4266-9dc3-6f5707452f49',
      focus_seconds: 600,
      total_seconds: 600,
      start_time: new Date().toISOString(),
      mode_changes: []
    })
    .select();

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Insert success:", data);
  }
}

run();
