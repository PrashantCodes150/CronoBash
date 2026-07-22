import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-url.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-key'
);

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  daily_goal_minutes: number;
  is_pro?: boolean;
  created_at: string;
  is_public?: boolean;
  last_seen_at?: string;
  points?: number;
  level?: number;
  badges?: string[];
  has_seen_onboarding?: boolean;
  followers_count?: number;
  is_verified?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'money';
  owner_id: string;
  max_members: number;
  entry_fee: number;
  platform_fee_percent: number;
  subject_tags: string[];
  description: string | null;
  is_active: boolean;
  invite_code?: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  total_focus_seconds_today: number;
  users?: UserProfile;
}

export interface StudySession {
  id: string;
  user_id: string;
  room_id: string | null;
  start_time: string;
  end_time: string | null;
  focus_seconds: number;
  total_seconds: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'winning' | 'platform_fee';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  planned_minutes: number;
  completed: boolean;
  date: string;
}

export interface Timetable {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
}
