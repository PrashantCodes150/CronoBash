import { BADGES } from './badges';

export function getLevelFromPoints(points: number): number {
  const calculated = Math.floor(points / 200) + 1;
  return Math.max(1, calculated);
}

export function getEarnedBadgesForLevel(level: number): string[] {
  return BADGES
    .filter(b => b.reqLevel <= level)
    .map(b => b.id);
}
