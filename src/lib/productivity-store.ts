import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface TaskItem {
  id: string;
  user_id?: string;
  title: string;
  subject: string;
  planned_minutes: number;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  start_date: string; // ISO or YYYY-MM-DD HH:mm
  end_date: string;
  category: 'study' | 'exam' | 'deadline' | 'personal';
  color: string;
}

export interface NoteItem {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  pinned: boolean;
  color: string;
  updated_at: string;
}

export interface TimeSessionLog {
  id: string;
  subject: string;
  duration_seconds: number;
  mode: 'stopwatch' | 'pomodoro';
  timestamp: string;
  notes?: string;
}

const STORAGE_KEYS = {
  TASKS: 'focus_arena_user_tasks_v3',
  EVENTS: 'focus_arena_user_events_v3',
  NOTES: 'focus_arena_user_notes_v3',
  SESSIONS: 'focus_arena_user_sessions_v3',
};

export function notifyProductivityChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('productivity_store_update'));
  }
}

export function getStoredTasks(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!raw) return [];
  try {
    const list: TaskItem[] = JSON.parse(raw);
    // Filter out any legacy sample IDs
    return list.filter(t => !['t-1', 't-2', 't-3'].includes(t.id));
  } catch {
    return [];
  }
}

export function saveStoredTasks(tasks: TaskItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    notifyProductivityChange();
  }
}

export function getStoredEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (!raw) return [];
  try {
    const list: CalendarEvent[] = JSON.parse(raw);
    return list.filter(e => !['e-1', 'e-2'].includes(e.id));
  } catch {
    return [];
  }
}

export function saveStoredEvents(events: CalendarEvent[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    notifyProductivityChange();
  }
}

export function getStoredNotes(): NoteItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!raw) return [];
  try {
    const list: NoteItem[] = JSON.parse(raw);
    return list.filter(n => !['n-1', 'n-2'].includes(n.id));
  } catch {
    return [];
  }
}

export function saveStoredNotes(notes: NoteItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    notifyProductivityChange();
  }
}

export function getStoredSessions(): TimeSessionLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSessionLog(log: TimeSessionLog) {
  if (typeof window !== 'undefined') {
    const list = getStoredSessions();
    const updated = [log, ...list];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    notifyProductivityChange();
  }
}

export function useProductivityStore() {
  const [tasks, setTasks] = useState<TaskItem[]>(getStoredTasks());
  const [events, setEvents] = useState<CalendarEvent[]>(getStoredEvents());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [sessions, setSessions] = useState<TimeSessionLog[]>(getStoredSessions());

  const refreshData = () => {
    setTasks(getStoredTasks());
    setEvents(getStoredEvents());
    setNotes(getStoredNotes());
    setSessions(getStoredSessions());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('productivity_store_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('productivity_store_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Supabase Sync on Auth
  useEffect(() => {
    async function syncFromSupabase() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        if (dbTasks && dbTasks.length > 0) {
          const mapped: TaskItem[] = dbTasks.map((t: any) => ({
            id: t.id,
            user_id: t.user_id,
            title: t.title,
            subject: t.subject || 'General',
            planned_minutes: t.planned_minutes || 30,
            completed: !!t.completed,
            status: t.completed ? 'completed' : 'todo',
            priority: 'medium',
            due_date: t.date || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          }));
          saveStoredTasks(mapped);
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err);
      }
    }
    syncFromSupabase();
  }, []);

  return {
    tasks,
    events,
    notes,
    sessions,

    // Task Actions
    addTask: (newTask: Omit<TaskItem, 'id' | 'created_at'>) => {
      const item: TaskItem = {
        ...newTask,
        id: 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        created_at: new Date().toISOString(),
      };
      const updated = [item, ...tasks];
      saveStoredTasks(updated);

      // Async sync to Supabase tasks table
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('tasks').insert({
            user_id: user.id,
            title: item.title,
            subject: item.subject,
            planned_minutes: item.planned_minutes,
            completed: item.completed,
            date: item.due_date,
          }).then();
        }
      });
    },

    toggleTask: (id: string) => {
      const currentTasks = getStoredTasks();
      const updated = currentTasks.map(t => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: (nextCompleted ? 'completed' : 'todo') as 'completed' | 'todo',
          };
        }
        return t;
      });
      saveStoredTasks(updated);

      // Async update in Supabase
      const target = updated.find(t => t.id === id);
      if (target && !id.startsWith('t-')) {
        supabase.from('tasks').update({ completed: target.completed }).eq('id', id).then();
      }
    },

    updateTaskStatus: (id: string, status: TaskItem['status']) => {
      const currentTasks = getStoredTasks();
      const updated = currentTasks.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status,
            completed: status === 'completed',
          };
        }
        return t;
      });
      saveStoredTasks(updated);
    },

    deleteTask: (id: string) => {
      const currentTasks = getStoredTasks();
      const updated = currentTasks.filter(t => t.id !== id);
      saveStoredTasks(updated);

      if (!id.startsWith('t-')) {
        supabase.from('tasks').delete().eq('id', id).then();
      }
    },

    // Calendar Event Actions
    addEvent: (newEvent: Omit<CalendarEvent, 'id'>) => {
      const item: CalendarEvent = {
        ...newEvent,
        id: 'e-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      };
      const currentEvents = getStoredEvents();
      const updated = [...currentEvents, item];
      saveStoredEvents(updated);
    },

    deleteEvent: (id: string) => {
      const currentEvents = getStoredEvents();
      const updated = currentEvents.filter(e => e.id !== id);
      saveStoredEvents(updated);
    },

    // Note Actions
    addNote: (newNote: Omit<NoteItem, 'id' | 'updated_at'>) => {
      const item: NoteItem = {
        ...newNote,
        id: 'n-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        updated_at: new Date().toISOString(),
      };
      const currentNotes = getStoredNotes();
      const updated = [item, ...currentNotes];
      saveStoredNotes(updated);
    },

    updateNote: (id: string, content: Partial<NoteItem>) => {
      const currentNotes = getStoredNotes();
      const updated = currentNotes.map(n => {
        if (n.id === id) {
          return { ...n, ...content, updated_at: new Date().toISOString() };
        }
        return n;
      });
      saveStoredNotes(updated);
    },

    togglePinNote: (id: string) => {
      const currentNotes = getStoredNotes();
      const updated = currentNotes.map(n => {
        if (n.id === id) {
          return { ...n, pinned: !n.pinned, updated_at: new Date().toISOString() };
        }
        return n;
      });
      saveStoredNotes(updated);
    },

    deleteNote: (id: string) => {
      const currentNotes = getStoredNotes();
      const updated = currentNotes.filter(n => n.id !== id);
      saveStoredNotes(updated);
    },

    // Time Session Actions
    logSession: (session: Omit<TimeSessionLog, 'id' | 'timestamp'>) => {
      const item: TimeSessionLog = {
        ...session,
        id: 's-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
      };
      addSessionLog(item);
    },
  };
}
