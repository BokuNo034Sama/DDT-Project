/**
 * Formula parameters for staff efficiency scoring.
 */
export interface EfficiencyParams {
  stagesCompleted: number;
  avgCompletionHours: number;
  faultCount: number;
}

/**
 * Calculates a monthly efficiency score (0-100).
 * Weights: Speed (50%) + Quality (50%) + Volume Bonus (up to 10pts).
 * Benchmark: 24h per stage.
 */
export function calculateEfficiencyScore({
  stagesCompleted,
  avgCompletionHours,
  faultCount,
}: EfficiencyParams): number {
  const BENCHMARK_HOURS = 24;
  const MAX_STAGES_EXPECTED = 10;

  // Speed Score: 100 is baseline, decreases as hours exceed benchmark
  const speedScore = Math.max(
    0,
    100 - ((avgCompletionHours / BENCHMARK_HOURS) * 100 - 100)
  );

  // Quality Score: -15 per fault
  const qualityScore = Math.max(0, 100 - faultCount * 15);

  // Volume Bonus: Scaling up to 10 based on output
  const volumeBonus = Math.min(
    10,
    (stagesCompleted / MAX_STAGES_EXPECTED) * 10
  );

  return Math.min(
    100,
    Math.round(speedScore * 0.5 + qualityScore * 0.5 + volumeBonus)
  );
}

/**
 * Formats a duration between two dates into a readable string like "2h 34m".
 */
export function formatDuration(
  startedAt: Date | string,
  completedAt: Date | string
): string {
  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return "0h 0m";

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
}
