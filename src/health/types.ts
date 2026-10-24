/** Steps per local day, keyed by YYYY-MM-DD. Days without data are omitted. */
export type DailySteps = Record<string, number>;

export interface HealthSource {
  /** Human-readable name of the platform store, shown in the UI. */
  name: string;
  isAvailable(): Promise<boolean>;
  /** Asks the OS for read access to steps. Resolves true if the dialog completed. */
  requestPermissions(): Promise<boolean>;
  /** Daily step totals for every day in [from, to] (inclusive, local time). */
  getDailySteps(from: Date, to: Date): Promise<DailySteps>;
  /** Opens the system screen where the user can manage access. */
  openSettings(): void;
}

export class HealthPermissionError extends Error {
  constructor() {
    super('Nema dozvole za čitanje koraka');
    this.name = 'HealthPermissionError';
  }
}
