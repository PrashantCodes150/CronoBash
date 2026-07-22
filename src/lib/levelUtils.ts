import { BADGES } from './badges';

export function getPointsForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    if (lvl <= 20) {
      total += 20; // 20 XP per level for noob pool (levels 1-20)
    } else if (lvl <= 30) {
      total += 50; // +50 XP per level
    } else if (lvl <= 50) {
      total += 100; // +100 XP per level
    } else if (lvl <= 70) {
      total += 200; // +200 XP per level
    } else if (lvl <= 90) {
      total += 400; // +400 XP per level
    } else {
      total += 1000; // +1000 XP per level for elite levels
    }
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
