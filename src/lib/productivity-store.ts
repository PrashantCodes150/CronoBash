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

export interface FlashcardItem {
  id: string;
  concept: string;
  simpleExplanation: string;
  subject: string;
  masteryLevel: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface SpacedTopicItem {
  id: string;
  topicName: string;
  subject: string;
  lastReviewed: string;
  nextReviewDays: number;
  retentionPercent: number;
}

const STORAGE_KEYS = {
  TASKS: 'focus_arena_user_tasks_v4',
  EVENTS: 'focus_arena_user_events_v4',
  NOTES: 'focus_arena_user_notes_v4',
  SESSIONS: 'focus_arena_user_sessions_v4',
  CARDS: 'focus_arena_user_cards_v4',
  SPACED: 'focus_arena_user_spaced_v4',
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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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

export function getStoredCards(): FlashcardItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredCards(cards: FlashcardItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    notifyProductivityChange();
  }
}

export function getStoredSpaced(): SpacedTopicItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.SPACED);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSpaced(topics: SpacedTopicItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SPACED, JSON.stringify(topics));
    notifyProductivityChange();
  }
}

export function useProductivityStore() {
  const [tasks, setTasks] = useState<TaskItem[]>(getStoredTasks());
  const [events, setEvents] = useState<CalendarEvent[]>(getStoredEvents());
  const [notes, setNotes] = useState<NoteItem[]>(getStoredNotes());
  const [sessions, setSessions] = useState<TimeSessionLog[]>(getStoredSessions());
  const [cards, setCards] = useState<FlashcardItem[]>(getStoredCards());
  const [spacedTopics, setSpacedTopics] = useState<SpacedTopicItem[]>(getStoredSpaced());

  const refreshData = () => {
    setTasks(getStoredTasks());
    setEvents(getStoredEvents());
    setNotes(getStoredNotes());
    setSessions(getStoredSessions());
    setCards(getStoredCards());
    setSpacedTopics(getStoredSpaced());
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

  return {
    tasks,
    events,
    notes,
    sessions,
    cards,
    spacedTopics,
    
    // Task Handlers
    addTask: (newTask: Omit<TaskItem, 'id' | 'created_at'>) => {
      const item: TaskItem = {
        ...newTask,
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
      };
      const updated = [item, ...getStoredTasks()];
      saveStoredTasks(updated);
    },

    toggleTask: (id: string) => {
      const list = getStoredTasks();
      const updated = list.map(t => {
        if (t.id === id) {
          const isDone = !t.completed;
          return { ...t, completed: isDone, status: (isDone ? 'completed' : 'todo') as any };
        }
        return t;
      });
      saveStoredTasks(updated);
    },

    updateTaskStatus: (id: string, status: TaskItem['status']) => {
      const list = getStoredTasks();
      const updated = list.map(t => {
        if (t.id === id) {
          return { ...t, status, completed: status === 'completed' };
        }
        return t;
      });
      saveStoredTasks(updated);
    },

    deleteTask: (id: string) => {
      const updated = getStoredTasks().filter(t => t.id !== id);
      saveStoredTasks(updated);
    },

    // Calendar Handlers
    addEvent: (newEvent: Omit<CalendarEvent, 'id'>) => {
      const item: CalendarEvent = {
        ...newEvent,
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      };
      const updated = [item, ...getStoredEvents()];
      saveStoredEvents(updated);
    },

    deleteEvent: (id: string) => {
      const updated = getStoredEvents().filter(e => e.id !== id);
      saveStoredEvents(updated);
    },

    // Note Handlers
    addNote: (newNote: Omit<NoteItem, 'id' | 'updated_at'>) => {
      const item: NoteItem = {
        ...newNote,
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        updated_at: new Date().toISOString(),
      };
      const updated = [item, ...getStoredNotes()];
      saveStoredNotes(updated);
    },

    togglePinNote: (id: string) => {
      const list = getStoredNotes();
      const updated = list.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
      saveStoredNotes(updated);
    },

    deleteNote: (id: string) => {
      const updated = getStoredNotes().filter(n => n.id !== id);
      saveStoredNotes(updated);
    },

    // Session Log Handlers
    logSession: (newLog: Omit<TimeSessionLog, 'id' | 'timestamp'>) => {
      const item: TimeSessionLog = {
        ...newLog,
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
      };
      addSessionLog(item);
    },

    // Feynman Cards Handlers
    addCard: (newCard: Omit<FlashcardItem, 'id' | 'created_at'>) => {
      const item: FlashcardItem = {
        ...newCard,
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        created_at: new Date().toISOString(),
      };
      const updated = [item, ...getStoredCards()];
      saveStoredCards(updated);
    },

    updateCardMastery: (id: string, masteryLevel: FlashcardItem['masteryLevel']) => {
      const list = getStoredCards();
      const updated = list.map(c => c.id === id ? { ...c, masteryLevel } : c);
      saveStoredCards(updated);
    },

    deleteCard: (id: string) => {
      const updated = getStoredCards().filter(c => c.id !== id);
      saveStoredCards(updated);
    },

    // Spaced Topics Handlers
    addSpacedTopic: (newTopic: Omit<SpacedTopicItem, 'id'>) => {
      const item: SpacedTopicItem = {
        ...newTopic,
        id: 'spaced_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      };
      const updated = [item, ...getStoredSpaced()];
      saveStoredSpaced(updated);
    },

    markTopicReviewed: (id: string) => {
      const list = getStoredSpaced();
      const updated = list.map(t => {
        if (t.id === id) {
          return {
            ...t,
            lastReviewed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            nextReviewDays: Math.min(t.nextReviewDays * 2, 30),
            retentionPercent: 100,
          };
        }
        return t;
      });
      saveStoredSpaced(updated);
    },

    deleteSpacedTopic: (id: string) => {
      const updated = getStoredSpaced().filter(t => t.id !== id);
      saveStoredSpaced(updated);
    },
  };
}
