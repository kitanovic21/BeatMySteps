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
  /**
   * Apps and devices that wrote steps in the last `days` days, most steps first.
   * Watches and bands show up here once their companion app syncs to the platform store.
   */
  getStepSources(days: number): Promise<StepSource[]>;
  /** Opens the system screen where the user can manage access. */
  openSettings(): void;
}

export interface StepSource {
  /** Android package name or iOS bundle identifier. */
  id: string;
  name: string;
  steps: number;
}

export class HealthPermissionError extends Error {
  constructor() {
    super('No permission to read steps');
    this.name = 'HealthPermissionError';
  }
}
