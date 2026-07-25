/**
 * Focus Score Calculation Helpers for CronoBash
 */

/**
 * Calculates a participant's focus score based on focus seconds and distraction strikes
 * Formula: Focus Score = (focus_seconds * 10) - (distraction_count * 15)
 */
export function calculateFocusScore(focusSeconds: number, distractionCount: number): number {
  const score = (focusSeconds * 10) - (distractionCount * 15);
  return Math.max(0, score); // Prevent negative focus scores
}

export interface StandingPlayer {
  userId: string;
  userName: string;
  avatarUrl?: string;
  focusSeconds: number;
  distractionCount: number;
}

export interface PlayerStanding {
  userId: string;
  userName: string;
  avatarUrl?: string;
  focusSeconds: number;
  distractionCount: number;
  focusScore: number;
  rank: number;
  rewardCoins?: number;
  rewardCash?: number;
}

/**
 * Computes standings and ranks players. Distributes money pot if applicable.
 */
export function computeStandings(
  players: StandingPlayer[],
  roomType: 'public' | 'private' | 'money',
  entryFee: number = 0,
  platformFeePercent: number = 10
): PlayerStanding[] {
  // Map and calculate scores
  const evaluated = players.map(p => {
    const focusScore = calculateFocusScore(p.focusSeconds, p.distractionCount);
    return {
      ...p,
      focusScore
    };
  });

  // Sort by score desc, then by distraction count asc
  evaluated.sort((a, b) => {
    if (b.focusScore !== a.focusScore) {
      return b.focusScore - a.focusScore;
    }
    return a.distractionCount - b.distractionCount;
  });

  // Compute standings and ranks
  let currentRank = 1;
  const standings: PlayerStanding[] = evaluated.map((player, index) => {
    if (index > 0) {
      const prev = evaluated[index - 1];
      if (player.focusScore < prev.focusScore) {
        currentRank = index + 1;
      }
    }
    
    // Allocate basic rewards (e.g. XP / Coins)
    let rewardCoins = 0;
    if (currentRank === 1) rewardCoins = 50;
    else if (currentRank === 2) rewardCoins = 25;
    else if (currentRank === 3) rewardCoins = 10;
    else rewardCoins = 5;

    return {
      ...player,
      rank: currentRank,
      rewardCoins
    };
  });

  // Allocate money lobby settlement rewards
  if (roomType === 'money' && entryFee > 0 && standings.length > 0) {
    const totalPot = entryFee * standings.length;
    const platformFee = totalPot * (platformFeePercent / 100);
    const netPot = totalPot - platformFee;

    // Find all first-rank winners (could be ties)
    const winners = standings.filter(s => s.rank === 1);
    const winShare = Math.floor(netPot / winners.length);

    standings.forEach(player => {
      if (player.rank === 1) {
        player.rewardCash = winShare;
      } else {
        player.rewardCash = 0;
      }
    });
  }

  return standings;
}
