// tests/stats.test.ts
/// <reference types="jest" />
// Unit tests auditing the CronoBash focus score formula

describe("CronoBash Focus Score Calculation Tests", () => {
  
  // Scoring formula: (effectiveFocusSeconds / (distractions + 1)) * consistencyMultiplier
  const calculateScore = (
    effectiveFocusSeconds: number,
    distractions: number,
    totalElapsedTime: number,
    isFakeCam = false
  ): number => {
    if (isFakeCam) return 0;
    
    const focusRatio = totalElapsedTime > 0 ? (effectiveFocusSeconds / totalElapsedTime) : 1;
    let consistencyMultiplier = 1.0;
    
    if (focusRatio > 0.8) {
      consistencyMultiplier = 1.2;
    } else if (focusRatio < 0.5) {
      consistencyMultiplier = 0.8;
    }
    
    return Math.round((effectiveFocusSeconds / (distractions + 1)) * consistencyMultiplier);
  };

  test("Should calculate standard score with no distractions and high consistency", () => {
    // 100 seconds elapsed, 90 seconds focused (ratio = 90% > 80% -> multiplier 1.2)
    // score = (90 / (0 + 1)) * 1.2 = 108
    const score = calculateScore(90, 0, 100);
    expect(score).toBe(108);
  });

  test("Should apply multiplier reductions for low focus consistency", () => {
    // 100 seconds elapsed, 40 seconds focused (ratio = 40% < 50% -> multiplier 0.8)
    // score = (40 / (0 + 1)) * 0.8 = 32
    const score = calculateScore(40, 0, 100);
    expect(score).toBe(32);
  });

  test("Should reduce score when distractions occur", () => {
    // 100 seconds elapsed, 80 seconds focused (ratio = 80% -> multiplier 1.0)
    // score = (80 / (3 + 1)) * 1.0 = 20
    const score = calculateScore(80, 3, 100);
    expect(score).toBe(20);
  });

  test("Should return zero if fake camera loop is flagged", () => {
    const score = calculateScore(95, 0, 100, true);
    expect(score).toBe(0);
  });
});
