// lib/speechSynthesis.ts

export function speakAlert(message: string, lang = 'hi-IN', volume = 1.0, rate = 1.1) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Cancel any active speech sounds immediately to play the newest alert
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = volume;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech Synthesis failed:", err);
  }
}
