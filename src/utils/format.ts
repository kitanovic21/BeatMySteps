const STEP_LENGTH_M = 0.762;
const KCAL_PER_STEP = 0.04;

/** 12345 → "12,345" */
export function formatSteps(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 8432 → "8.4k", 12000 → "12k" */
export function formatCompact(n: number): string {
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function stepsToKm(steps: number): string {
  return ((steps * STEP_LENGTH_M) / 1000).toFixed(1);
}

export function stepsToKcal(steps: number): string {
  return String(Math.round(steps * KCAL_PER_STEP));
}

/** Rough active minutes (≈100 steps / min of walking) */
export function stepsToMinutes(steps: number): string {
  return String(Math.round(steps / 100));
}
