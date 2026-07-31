-- ==============================================================================
-- CRONOBASH POSTGREST SCHEMA CACHE RELOAD
-- Migration: 20260731000020_reload_schema_cache.sql
-- Description: Signals PostgREST API service to reload schema cache so new columns 
--              (ai_coach_persona, primary_discipline, etc.) are instantly recognized.
-- ==============================================================================

NOTIFY pgrst, 'reload schema';
