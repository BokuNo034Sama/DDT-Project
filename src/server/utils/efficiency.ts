/**
 * Calculates the monthly efficiency score for a staff member.
 * 
 * Weights: Speed (50%) + Quality (50%) + Volume Bonus (up to 10%)
 * Maximum score: 100
 */
export function calculateEfficiencyScore(
  stagesCompleted: number,
  avgCompletionHours: number,
  faultCount: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  siteVisitsCount: number
): number {
  const BENCHMARK_HOURS = 24; // baseline: 24h per stage
  const MAX_STAGES_EXPECTED = 10; // per month target

  // Avoid division by zero or negative hours, and default to benchmark if no stages completed
  const safeAvgHours = stagesCompleted > 0 ? Math.max(0, avgCompletionHours) : BENCHMARK_HOURS;
  
  // Speed Score: 100 if at or below benchmark, decreases as hours go up
  // PRD formula: Math.max(0, 100 - ((avgCompletionHours / BENCHMARK_HOURS) * 100 - 100))
  let speedScore = 100;
  if (safeAvgHours > BENCHMARK_HOURS) {
    const penalty = ((safeAvgHours / BENCHMARK_HOURS) * 100) - 100;
    speedScore = Math.max(0, 100 - penalty);
  }

  // Quality Score: -15 points per fault
  const qualityScore = Math.max(0, 100 - faultCount * 15);

  // Volume Bonus: Up to 10 extra points based on stages completed
  const volumeBonus = Math.min(10, (stagesCompleted / MAX_STAGES_EXPECTED) * 10);

  // Final Calculation
  const finalScore = Math.round(speedScore * 0.5 + qualityScore * 0.5 + volumeBonus);

  return Math.min(100, Math.max(0, finalScore));
}
