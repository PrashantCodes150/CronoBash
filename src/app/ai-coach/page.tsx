"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { 
  Bot, Send, Sparkles, Volume2, VolumeX, Copy, Check, 
  RotateCcw, Zap, BookOpen, Brain, Flame, HelpCircle, 
  ChevronRight, Award, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogoLoader from '@/components/LogoLoader';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const PERSONAS = [
  {
    id: 'Quantum',
    name: 'Prof. Quantum',
    role: 'Academic Tutor',
    desc: 'Structured academic explanations, derivations & step-by-step exam solutions.',
    icon: '🎓',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    promptStyle: 'Explain with clear academic structure, bullet points, and real-world analogies.'
  },
  {
    id: 'Sergeant',
    name: 'Drill Sergeant',
    role: 'Focus Mentor',
    desc: 'High-energy, no-nonsense study motivation & quick problem-solving formulas.',
    icon: '🎯',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    promptStyle: 'Be direct, high-energy, and give 3 actionable steps without fluff.'
  },
  {
    id: 'Hacker',
    name: 'Cyber Hacker',
    role: 'Code & Tech Lead',
    desc: 'Python/JS/C++ code snippets, algorithm breakdowns & time complexity tips.',
    icon: '⚡',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    promptStyle: 'Provide clean, optimized code snippets and concise technical explanations.'
  }
];

const PRESET_PROMPTS = [
  { label: '💡 Explain a Topic Simply', text: 'Explain Quantum Computing in simple terms with an everyday analogy.' },
  { label: '📝 Create 2-Hour Study Plan', text: 'Create a structured 2-hour intensive study roadmap for Data Structures & Algorithms.' },
  { label: '❓ Generate 3 Quiz Questions', text: 'Generate 3 multiple choice quiz questions to test my knowledge on Calculus & Derivatives.' },
  { label: '🚀 Focus Motivation Boost', text: 'I am feeling distracted and unmotivated. Give me a 30-second mindset reset to start studying right now.' },
  { label: '⚡ Code Problem Solver', text: 'Explain the difference between BFS and DFS graph algorithms with time complexity.' }
];

export default function AICoachPage() {
  const { user, profile } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `Greetings, Arena Fighter! I am **${PERSONAS[0].name}**, your personal AI Study Assistant. Ask me any question on Science, Math, Coding, or Exam Prep, and let's crush your goals together!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Text-to-Speech
  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!", { icon: '📋' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate intelligent response
  const generateAIResponse = async (userPrompt: string, persona: typeof PERSONAS[0]) => {
    setIsTyping(true);

    try {
      // 1. Try fetching from free AI endpoint (or intelligent fallback)
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are ${persona.name}, a world-class AI study tutor and focus mentor on CronoBash. ${persona.promptStyle} Always format output clearly with markdown, bold key concepts, bullet points, and code blocks where applicable.`
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          model: "openai"
        })
      });

      if (response.ok) {
        const textResult = await response.text();
        if (textResult && textResult.trim().length > 10) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: 'bot',
              text: textResult.trim(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Pollinations AI API fallback triggered:", e);
    }

    // Smart Local Knowledge Engine Fallback
    setTimeout(() => {
      let fallbackText = "";
      const lower = userPrompt.toLowerCase();

      if (lower.includes("quantum") || lower.includes("physics")) {
        fallbackText = `### ⚛️ Quantum Mechanics Core Concept\n\nQuantum mechanics describes nature at the atomic scale.\n\n* **Wave-Particle Duality**: Matter exhibits both wave-like and particle-like properties.\n* **Superposition**: A system can exist in multiple states simultaneously until measured.\n* **Entanglement**: Particles become interconnected regardless of distance.\n\n💡 **Exam Tip**: Remember Heisenberg's Uncertainty Principle: $\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$. You cannot simultaneously know exact position and momentum!`;
      } else if (lower.includes("plan") || lower.includes("schedule") || lower.includes("roadmap")) {
        fallbackText = `### 🎯 2-Hour High-Stakes Focus Sprint Roadmap\n\n* **Block 1 (45 mins)**: Core Theory & Hardest Concepts. No phone, zero distractions.\n* **Rest (10 mins)**: Walk around, drink water, rest eyes.\n* **Block 2 (45 mins)**: Active recall & Problem Solving. Solve 3 hard questions.\n* **Review (20 mins)**: Summarize key formulas & errors in a cheat sheet.\n\n🔥 **Arena Rule**: Lock in your webcam gaze tracking for maximum XP bonus!`;
      } else if (lower.includes("code") || lower.includes("algorithm") || lower.includes("bfs") || lower.includes("dfs")) {
        fallbackText = `### ⚡ BFS vs DFS Algorithm Breakdown\n\n\`\`\`python\n# Breadth-First Search (Queue - FIFO)\nfrom collections import deque\ndef bfs(graph, start):\n    visited = set([start])\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        print(node, end=" ")\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n\`\`\`\n\n* **BFS**: Uses Queue. Best for Shortest Path in unweighted graphs. Time: $O(V + E)$.\n* **DFS**: Uses Stack/Recursion. Best for Maze solving & Pathfinding. Time: $O(V + E)$.`;
      } else if (lower.includes("quiz") || lower.includes("question")) {
        fallbackText = `### ❓ Quick Study Quiz (3 Questions)\n\n**Q1**: What is the time complexity of searching in a Balanced Binary Search Tree (AVL/Red-Black)?\n- A) $O(N)$\n- B) $O(\\log N)$ ✅\n- C) $O(1)$\n\n**Q2**: Which law states that current is directly proportional to potential difference?\n- A) Ohm's Law ✅\n- B) Faraday's Law\n- C) Newton's Law\n\n**Q3**: What data structure does recursion implicitly use?\n- A) Queue\n- B) Call Stack ✅\n- C) Heap`;
      } else {
        fallbackText = `### 🚀 Key Focus Analysis for "${userPrompt}"\n\nHere is the structured breakdown to help you master this concept:\n\n1. **Core Definition**: Break down complex ideas into 3 fundamental principles.\n2. **Active Application**: Test yourself by explaining this concept back out loud without looking at notes.\n3. **Practical Formula**: Combine theory with practice in a 25-minute Pomodoro study sprint.\n\nKeep pushing, fighter! Focus is your superpower in the Arena. ⚡`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentQuery = inputQuery.trim();
    setInputQuery('');

    generateAIResponse(currentQuery, selectedPersona);
  };

  const handlePresetClick = (promptText: string) => {
    setInputQuery(promptText);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white p-3 sm:p-6 max-w-6xl mx-auto space-y-5 selection:bg-cyan-500 selection:text-black font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 p-4 sm:p-6 rounded-3xl shadow-[0_0_30px_rgba(0,229,255,0.12)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
            <Bot className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide bg-gradient-to-r from-cyan-400 via-blue-300 to-white bg-clip-text text-transparent">
                AURA AI — Cybernetic Study Assistant
              </h1>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                100% FREE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-cyan-200/70 font-mono mt-1">
              Ask anything on Math, Science, Coding, Exam Prep or get instant 2-hour study schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMessages([messages[0]])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Sidebar - Persona Selector & Presets */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Persona Switcher Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Select AI Tutor Persona</span>
            </h2>

            <div className="space-y-2">
              {PERSONAS.map(p => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPersona(p);
                      toast.success(`Switched persona to ${p.name}!`, { icon: p.icon });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? `${p.badgeBg} shadow-[0_0_15px_rgba(0,229,255,0.15)] ring-1 ring-cyan-400/50`
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{p.icon}</span>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        <span className="text-[10px] font-mono opacity-80 uppercase font-semibold">{p.role}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Presets Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Instant Quick Actions</span>
            </h2>

            <div className="space-y-1.5">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(preset.text)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-between group"
                >
                  <span>{preset.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Chat Chamber */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[550px] max-h-[700px] shadow-2xl">
          
          {/* Active Persona Banner Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{selectedPersona.icon}</span>
              <div>
                <span className="font-bold text-sm text-white">{selectedPersona.name}</span>
                <span className="text-[11px] text-cyan-400/80 font-mono block leading-none mt-0.5">
                  Active Persona • {selectedPersona.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>AI Online</span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 font-sans text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 text-sm">
                    {selectedPersona.icon}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 space-y-2 relative group ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-lg'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-xl'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] opacity-70 font-mono">
                    <span>{msg.timestamp}</span>

                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          className="hover:text-cyan-400 transition-colors p-1"
                          title="Read out loud (Text to Speech)"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-cyan-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-cyan-400 transition-colors p-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-cyan-400 font-mono text-xs p-2 bg-cyan-950/20 border border-cyan-500/20 rounded-xl w-fit animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{selectedPersona.name} is thinking &amp; generating study answer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Footer */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask ${selectedPersona.name} any study or coding question...`}
              className="flex-grow bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Ask AI</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
