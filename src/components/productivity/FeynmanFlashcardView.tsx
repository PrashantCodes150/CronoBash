"use client";

import React, { useState } from 'react';
import { useProductivityStore } from '@/lib/productivity-store';
import { Plus, Layers, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FeynmanFlashcardView() {
  const { cards, addCard, updateCardMastery, deleteCard } = useProductivityStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Black Pill Switch
  const [speakAudio, setSpeakAudio] = useState(true);

  // Form State
  const [concept, setConcept] = useState('');
  const [simpleExplanation, setSimpleExplanation] = useState('');
  const [subject, setSubject] = useState('Engineering');

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !simpleExplanation.trim()) return;

    addCard({
      concept: concept.trim(),
      simpleExplanation: simpleExplanation.trim(),
      subject: subject.trim() || 'General',
      masteryLevel: 'hard',
    });

    setConcept('');
    setSimpleExplanation('');
    setIsModalOpen(false);
    toast.success('Feynman active recall card added! ⚡');
  };

  const handleToggleCardFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    
    if (nextFlipped && speakAudio && activeCard && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${activeCard.concept}. ${activeCard.simpleExplanation}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRateMastery = (level: 'easy' | 'medium' | 'hard') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (cards.length === 0) return;
    const activeCard = cards[currentIndex];
    if (activeCard) {
      updateCardMastery(activeCard.id, level);
    }
    setIsFlipped(false);
    if (cards.length > 0) {
      setCurrentIndex((currentIndex + 1) % cards.length);
    }
    toast.success(`Marked as ${level.toUpperCase()}!`);
  };

  const activeCard = cards[currentIndex] || cards[0];
  const easyCount = cards.filter(c => c.masteryLevel === 'easy').length;

  return (
    <div className="space-y-6">
      
      {/* ── TOP METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F43F5E] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">style</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Cards</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{cards.length} Flashcards</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">workspace_premium</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Mastered Cards</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{easyCount} Mastered</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">psychology</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Deck</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Card {cards.length > 0 ? currentIndex + 1 : 0} of {cards.length}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

        <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-lg font-bold">trending_up</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Recall Mastery</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{cards.length > 0 ? Math.round((easyCount / cards.length) * 100) : 0}%</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">north_east</span>
        </div>

      </div>

      {/* ── CONTROLS & BLACK PILL SWITCHES ── */}
      <div className="morphism-card bg-white p-5 rounded-[24px] border border-white/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100">
            <span className="w-7 h-7 rounded-full bg-[#9333EA] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-xs">record_voice_over</span>
            </span>
            <span className="text-xs font-bold text-slate-900 shrink-0">Read Out Explanations</span>
            <button
              onClick={() => setSpeakAudio(!speakAudio)}
              className={`w-11 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                speakAudio ? 'bg-[#1D1D1F]' : 'bg-slate-200'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${speakAudio ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition hover:scale-105 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Concept Card</span>
        </button>
      </div>

      {/* ── FLASHCARD INTERACTIVE STAGE ── */}
      {cards.length === 0 ? (
        <div className="morphism-card bg-white text-center py-16 space-y-3 rounded-[28px] border border-white/80">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No Feynman flashcards added yet</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#3B82F6] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">
            + Add First Concept Card
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          <div
            onClick={handleToggleCardFlip}
            className="morphism-card bg-white min-h-[280px] p-8 rounded-[32px] border border-white/80 shadow-md flex flex-col justify-between text-center cursor-pointer hover:shadow-lg transition-all relative overflow-hidden group"
          >
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-400">
              <span className="bg-blue-50 text-[#3B82F6] px-3 py-1 rounded-full border border-blue-100 uppercase">
                #{activeCard?.subject || 'General'}
              </span>
              <div className="flex items-center gap-2">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCard(activeCard.id);
                    toast.success('Card deleted');
                  }}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="my-auto py-6">
              {!isFlipped ? (
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tap to reveal explanation</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {activeCard?.concept}
                  </h3>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-[#10B981] text-[10px] font-extrabold uppercase tracking-widest">Simplified Explanation</span>
                  <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed px-2">
                    &ldquo;{activeCard?.simpleExplanation}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="text-[10px] font-bold text-slate-400">
              {isFlipped ? 'Click card to flip back' : 'Click card to show simple answer 💡'}
            </div>
          </div>

          {isFlipped && (
            <div className="flex flex-wrap items-center justify-center gap-3 animate-fadeIn">
              <button
                onClick={() => handleRateMastery('hard')}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl text-xs font-extrabold cursor-pointer transition shadow-sm"
              >
                🔴 Still Hard
              </button>
              <button
                onClick={() => handleRateMastery('medium')}
                className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl text-xs font-extrabold cursor-pointer transition shadow-sm"
              >
                🟡 Getting There
              </button>
              <button
                onClick={() => handleRateMastery('easy')}
                className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-extrabold cursor-pointer transition shadow-sm"
              >
                🟢 Mastered ✓
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE CARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-gray-100 w-full max-w-md rounded-[28px] p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Add Feynman Concept Card</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concept / Term Name</label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  placeholder="e.g. Quantum Superposition, Photosynthesis"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Simple Explanation</label>
                <textarea
                  rows={3}
                  required
                  value={simpleExplanation}
                  onChange={e => setSimpleExplanation(e.target.value)}
                  placeholder="Explain like to a 10-yr old..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Tag</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Math, CS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#1D1D1F] hover:bg-black text-white font-black py-2.5 rounded-xl text-xs transition-transform hover:scale-105 cursor-pointer shadow-md">Add Card ⚡</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
