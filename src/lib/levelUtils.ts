import { BADGES } from './badges';

/**
 * XP needed to REACH a given level (cumulative, exponential curve).
 * Level 1   = 0 XP   (starting point)
 * Level 2   = 100 XP
 * Level 5   = ~800 XP
 * Level 10  = ~4 500 XP
 * Level 25  = ~60 000 XP
 * Level 50  = ~800 000 XP
 * Level 100 = ~20 000 000 XP
 *
 * Formula per level: XP_needed(lvl) = floor(100 * (lvl ^ 2.5))
 * This means every new level costs significantly MORE than the last.
 */
export function getPointsForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let lvl = 2; lvl <= level; lvl++) {
    // Each level requires floor(80 * lvl^2.4) XP on top of the previous total
    total += Math.floor(80 * Math.pow(lvl, 2.4));
  }
  return total;
}

export function getLevelFromPoints(points: number): number {
  if (points <= 0) return 1;
  let lvl = 1;
  while (lvl < 100 && points >= getPointsForLevel(lvl + 1)) {
    lvl++;
  }
  return Math.min(100, Math.max(1, lvl));
}

export function getEarnedBadgesForLevel(level: number): string[] {
  return BADGES
    .filter(b => b.reqLevel <= level)
    .map(b => b.id);
}

/**
 * Returns XP needed to advance from current level to next.
 * Useful for showing progress bars.
 */
export function getXpForNextLevel(level: number): number {
  if (level >= 100) return 0;
  return getPointsForLevel(level + 1) - getPointsForLevel(level);
}

/**
 * Returns XP progress within the current level bracket.
 */
export function getXpProgressInLevel(points: number): { current: number; required: number; percent: number } {
  const level = getLevelFromPoints(points);
  if (level >= 100) return { current: 0, required: 0, percent: 100 };
  const base = getPointsForLevel(level);
  const next = getPointsForLevel(level + 1);
  const current = points - base;
  const required = next - base;
  return { current, required, percent: Math.min(100, Math.round((current / required) * 100)) };
}
