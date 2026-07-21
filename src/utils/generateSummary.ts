// utils/generateSummary.ts

interface SessionStats {
  focusPercent: number;
  distractionCount: number;
}

export function generateSummary(stats: SessionStats) {
  const tips = [
    "Try studying early in the morning—our telemetry shows peak focus before noon.",
    "Try setting your phone to silent/do-not-disturb mode to minimize micro-distractions.",
    "Shorter 25-minute sprints help maintain consistent point multipliers."
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  // Basic diagnostic logic
  const isHighFocus = stats.focusPercent >= 80;
  const hasTooManyDistractions = stats.distractionCount >= 3;

  return {
    good: isHighFocus 
      ? `Phenomenal job! Maintained ${stats.focusPercent}% focus with stable point multipliers.`
      : `Solid attempt! Completed the study session at ${stats.focusPercent}% focus ratio.`,
    improve: hasTooManyDistractions 
      ? `You had ${stats.distractionCount} distraction spikes. Try minimizing movements.`
      : `Excellent composure. Very low distraction coordinates logged.`,
    tip: randomTip
  };
}
